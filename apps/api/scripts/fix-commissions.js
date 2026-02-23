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
    console.log("Fetching global platform settings...");
    const settings = await prisma.platformSettings.findUnique({
        where: { id: "global" },
    });
    if (!settings) {
        console.error("Global settings not found");
        process.exit(1);
    }
    const defaultComm = settings.defaultCommissionLevel || "LOW";
    console.log(`Global default commission level is: ${defaultComm}`);
    // We assume that the vast majority of users showing "LOW" right now
    // got it by accidentally falling back to the schema default instead of the actual platform default.
    // We'll sync them all so the legacy records reflect the real system default.
    const result = await prisma.user.updateMany({
        where: {
            commissionLevel: "LOW", // Or we could just update everyone if they've never been manually edited
        },
        data: {
            commissionLevel: defaultComm,
        },
    });
    console.log(`Successfully updated ${result.count} existing users to the system default (${defaultComm}).`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
