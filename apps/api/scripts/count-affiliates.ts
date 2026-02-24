import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        include: {
            affiliate: true,
        }
    });

    const affiliates = await prisma.affiliate.findMany();

    console.log(`Total users: ${users.length}`);
    console.log(`Total users with an affiliate profile: ${users.filter((u: any) => u.affiliate).length}`);
    console.log(`Total affiliates in Affiliate table: ${affiliates.length}`);
    console.log(`Of those affiliates, total status ACTIVE: ${affiliates.filter((a: any) => a.status === 'ACTIVE').length}`);
    console.log(`Of those affiliates, total status PENDING: ${affiliates.filter((a: any) => a.status === 'PENDING').length}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
