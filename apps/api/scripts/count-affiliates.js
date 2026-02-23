"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, "../.env") });
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        include: {
            affiliate: true,
        }
    });
    const affiliates = await prisma.affiliate.findMany();
    console.log(`Total users: ${users.length}`);
    console.log(`Total users with an affiliate profile: ${users.filter(u => u.affiliate).length}`);
    console.log(`Total affiliates in Affiliate table: ${affiliates.length}`);
    console.log(`Of those affiliates, total status ACTIVE: ${affiliates.filter(a => a.status === 'ACTIVE').length}`);
    console.log(`Of those affiliates, total status PENDING: ${affiliates.filter(a => a.status === 'PENDING').length}`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
