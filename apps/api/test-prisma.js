"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
});
async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Connected successfully to PostgreSQL');
        const result = await prisma.$queryRaw `SELECT current_database(), current_user`;
        console.log('Result:', result);
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('❌ Connection failed:', error);
        process.exit(1);
    }
}
main();
