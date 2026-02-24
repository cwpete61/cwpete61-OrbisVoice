
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "myorbislocal@gmail.com";
    console.log(`Updating ${email} to ADMIN...`);

    const user = await prisma.user.findUnique({
        where: { email }
    });

    if (!user) {
        console.error(`User ${email} not found.`);
        return;
    }

    await prisma.user.update({
        where: { id: user.id },
        data: {
            role: "ADMIN",
            isAdmin: true,
            username: "Admin"
        }
    });

    console.log(`Successfully forced ${email} to ADMIN role.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
