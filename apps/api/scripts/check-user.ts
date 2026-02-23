import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
    const email = "admin@orbisvoice.app";
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        console.log("User found:", user);
    } else {
        console.log("User not found");
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
