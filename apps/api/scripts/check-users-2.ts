import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
    const emails = ["admin@orbisvoice.app", "wbrown@browncorp.com"];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: email },
                    { username: email } as any
                ]
            }
        });

        console.log("----");
        console.log(`Checking ${email}:`);
        console.log(user);
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
