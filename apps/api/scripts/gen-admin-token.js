"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const p = new client_1.PrismaClient();
async function main() {
    // Get system admin user
    const admin = await p.user.findUnique({
        where: { email: "myorbislocal@gmail.com" }
    });
    if (!admin) {
        console.error("Admin not found!");
        return;
    }
    // Generate a JWT just like the API does
    const token = jsonwebtoken_1.default.sign({ userId: admin.id, tenantId: admin.tenantId, email: admin.email }, process.env.JWT_SECRET || "dev-secret-key-change-in-production", { expiresIn: "1h" });
    console.log("==============");
    console.log("ADMIN TOKEN:");
    console.log(token);
    console.log("==============");
    console.log("Admin:", admin.email, "|", admin.role);
}
main()
    .catch(console.error)
    .finally(() => p.$disconnect());
