"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFaq = searchFaq;
exports.generateAnswer = generateAnswer;
exports.updateFaqEmbedding = updateFaqEmbedding;
const db_1 = require("../db");
const logger_1 = require("../logger");
const env_1 = require("../env");
const openai_1 = __importDefault(require("openai"));
// ─── OpenAI client ────────────────────────────────────────────────────────────
function getClient() {
    if (!env_1.env.OPENAI_API_KEY)
        throw new Error("OPENAI_API_KEY not set");
    return new openai_1.default({ apiKey: env_1.env.OPENAI_API_KEY });
}
// ─── Embed a string using OpenAI text-embedding-3-small ──────────────────────
async function embedText(text) {
    const client = getClient();
    const res = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return res.data[0].embedding;
}
// ─── Format embedding as pgvector literal ────────────────────────────────────
function vecLiteral(embedding) {
    return `[${embedding.join(",")}]`;
}
// ─── Search FAQ using cosine similarity (pgvector) with text fallback ─────────
async function searchFaq(question, limit = 3) {
    try {
        const embedding = await embedText(question);
        const vec = vecLiteral(embedding);
        const results = await db_1.prisma.$queryRaw `
      SELECT id, question, answer, category, helpful, "notHelpful"
      FROM "FaqEntry"
      WHERE published = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vec}::vector
      LIMIT ${limit}
    `;
        return results;
    }
    catch {
        // pgvector not available or embedding failed — fall back to keyword search
        logger_1.logger.warn("Vector search unavailable, using keyword fallback");
        return db_1.prisma.faqEntry.findMany({
            where: {
                published: true,
                question: { contains: question.slice(0, 50), mode: "insensitive" },
            },
            take: limit,
        });
    }
}
// ─── Generate answer with GPT-4o-mini (RAG) ──────────────────────────────────
async function generateAnswer(question) {
    const sources = await searchFaq(question);
    let answer = "";
    try {
        const client = getClient();
        const contextBlock = sources.length > 0
            ? sources
                .map((s, i) => `[${i + 1}] Q: ${s.question}\nA: ${s.answer}`)
                .join("\n\n")
            : "";
        const systemPrompt = contextBlock
            ? `You are an OrbisVoice support assistant. Answer the user's question using the knowledge base below. Be concise, helpful, and friendly. If the context doesn't fully answer the question, supplement with your general knowledge about voice AI platforms.\n\nKnowledge Base:\n${contextBlock}`
            : "You are an OrbisVoice support assistant. OrbisVoice is a voice AI platform that lets businesses deploy AI voice agents for customer interactions, lead capture, and appointment booking. Answer helpfully and concisely.";
        const completion = await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: question },
            ],
            max_tokens: 512,
            temperature: 0.4,
        });
        answer = completion.choices[0]?.message?.content ?? "";
    }
    catch (err) {
        logger_1.logger.error(err, "OpenAI answer generation failed");
        // Fall back to top FAQ source answer if available
        if (sources.length > 0) {
            answer = sources[0].answer;
        }
        else {
            answer = "I'm sorry, I couldn't find an answer to that question right now. Please contact our support team for assistance.";
        }
    }
    // Store question in queue for admin review (async, non-blocking)
    db_1.prisma.faqQuestion
        .create({ data: { question, suggestedAnswer: answer, status: "pending" } })
        .catch(() => { });
    return { answer, sources };
}
// ─── Update FAQ entry embedding ───────────────────────────────────────────────
async function updateFaqEmbedding(faqId) {
    try {
        const entry = await db_1.prisma.faqEntry.findUnique({ where: { id: faqId } });
        if (!entry)
            return;
        const embedding = await embedText(`${entry.question} ${entry.answer}`);
        const vec = vecLiteral(embedding);
        await db_1.prisma.$executeRaw `
      UPDATE "FaqEntry" SET embedding = ${vec}::vector WHERE id = ${faqId}
    `;
    }
    catch {
        logger_1.logger.warn("Could not update FAQ embedding (pgvector may not be available or OpenAI key missing)");
    }
}
