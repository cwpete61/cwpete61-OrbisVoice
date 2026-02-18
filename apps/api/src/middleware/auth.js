"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.decodeToken = decodeToken;
const jwt_1 = __importDefault(require("@fastify/jwt"));
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
    }
}
function decodeToken(token, secret) {
    try {
        return jwt_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
