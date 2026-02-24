
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const admins = [
        {
            email: "Crawford.peterson.sr@gmail.com",
            password: "Orbis@8214@@!!",
            name: "Crawford Peterson",
            username: "Crawford"
        },
        {
            email: "myorbislocal@gmail.com",
            password: "Orbis@Admin2024!", // Default admin password for manual login
            name: "Orbis Local Admin",
            username: "OrbisLocal"
        }
    ];

    for (const admin of admins) {
        console.log(`Ensuring ADMIN: ${admin.email}...`);
        const hashedPassword = await bcrypt.hash(admin.password, 10);

        let user = await prisma.user.findUnique({
            where: { email: admin.email }
        });

        if (user) {
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    role: "ADMIN",
                    isAdmin: true,
                    username: admin.username,
                    passwordHash: hashedPassword,
                    name: admin.name
                }
            });
            console.log(`Updated ${admin.email} to ADMIN.`);
        } else {
            // Create tenant
            const tenant = await prisma.tenant.create({
                data: { name: `${admin.name}'s Workspace` }
            });

            await prisma.user.create({
                data: {
                    email: admin.email,
                    name: admin.name,
                    username: admin.username,
                    passwordHash: hashedPassword,
                    tenantId: tenant.id,
                    role: "ADMIN",
                    isAdmin: true,
                    commissionLevel: "HIGH"
                } as any
            });
            console.log(`Created NEW ADMIN: ${admin.email}.`);
        }
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
