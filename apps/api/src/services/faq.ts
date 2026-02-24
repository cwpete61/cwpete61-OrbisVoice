import { prisma } from "../db";
import { logger } from "../logger";
import { env } from "../env";
import OpenAI from "openai";

// ─── OpenAI client ────────────────────────────────────────────────────────────
function getClient(): OpenAI {
    if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not set");
    return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}

// ─── Embed a string using OpenAI text-embedding-3-small ──────────────────────
async function embedText(text: string): Promise<number[]> {
    const client = getClient();
    const res = await client.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return res.data[0].embedding;
}

// ─── Format embedding as pgvector literal ────────────────────────────────────
function vecLiteral(embedding: number[]): string {
    return `[${embedding.join(",")}]`;
}

// ─── Search FAQ using cosine similarity (pgvector) with text fallback ─────────
export async function searchFaq(question: string, limit = 3): Promise<any[]> {
    try {
        const embedding = await embedText(question);
        const vec = vecLiteral(embedding);

        const results: any[] = await prisma.$queryRaw`
      SELECT id, question, answer, category, helpful, "notHelpful"
      FROM "FaqEntry"
      WHERE published = true
        AND embedding IS NOT NULL
      ORDER BY embedding <=> ${vec}::vector
      LIMIT ${limit}
    `;
        return results;
    } catch {
        // pgvector not available or embedding failed — fall back to keyword search
        logger.warn("Vector search unavailable, using keyword fallback");
        return prisma.faqEntry.findMany({
            where: {
                published: true,
                question: { contains: question.slice(0, 50), mode: "insensitive" },
            },
            take: limit,
        });
    }
}

// ─── Generate answer with GPT-4o-mini (RAG) ──────────────────────────────────
export async function generateAnswer(question: string): Promise<{
    answer: string;
    sources: any[];
}> {
    const sources = await searchFaq(question);

    let answer = "";
    try {
        const client = getClient();

        const contextBlock =
            sources.length > 0
                ? sources
                    .map((s: any, i: number) => `[${i + 1}] Q: ${s.question}\nA: ${s.answer}`)
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
    } catch (err) {
        logger.error(err, "OpenAI answer generation failed");
        // Fall back to top FAQ source answer if available
        if (sources.length > 0) {
            answer = sources[0].answer;
        } else {
            answer = "I'm sorry, I couldn't find an answer to that question right now. Please contact our support team for assistance.";
        }
    }

    // Store question in queue for admin review (async, non-blocking)
    prisma.faqQuestion
        .create({ data: { question, suggestedAnswer: answer, status: "pending" } })
        .catch(() => { });

    return { answer, sources };
}

// ─── Update FAQ entry embedding ───────────────────────────────────────────────
export async function updateFaqEmbedding(faqId: string): Promise<void> {
    try {
        const entry = await prisma.faqEntry.findUnique({ where: { id: faqId } });
        if (!entry) return;

        const embedding = await embedText(`${entry.question} ${entry.answer}`);
        const vec = vecLiteral(embedding);

        await prisma.$executeRaw`
      UPDATE "FaqEntry" SET embedding = ${vec}::vector WHERE id = ${faqId}
    `;
    } catch {
        logger.warn("Could not update FAQ embedding (pgvector may not be available or OpenAI key missing)");
    }
}
