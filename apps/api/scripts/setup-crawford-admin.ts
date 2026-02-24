
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const email = "Crawford.peterson.sr@gmail.com";
    const password = "Orbis@8214@@!!";
    const name = "Crawford Peterson";
    const username = "Crawford"; // Use a specific username to avoid conflict with "Admin"

    console.log(`Setting up admin: ${email}...`);

    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Ensure Tenant exists or create one
    let user = await prisma.user.findUnique({
        where: { email },
        include: { tenant: true }
    });

    let tenantId = user?.tenantId;

    if (!tenantId) {
        const tenant = await prisma.tenant.create({
            data: { name: `${name}'s Workspace` }
        });
        tenantId = tenant.id;
    }

    // 2. Create or Update user
    if (user) {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                role: "ADMIN",
                isAdmin: true,
                username: username,
                passwordHash: hashedPassword,
                name: name
            }
        });
        console.log(`Updated existing user ${email} to ADMIN with new password.`);
    } else {
        // Try to create with preferred username, fallback to random if conflict
        try {
            await prisma.user.create({
                data: {
                    email,
                    name,
                    username: username,
                    passwordHash: hashedPassword,
                    tenantId,
                    role: "ADMIN",
                    isAdmin: true,
                    commissionLevel: "HIGH"
                } as any
            });
            console.log(`Created new admin user ${email} with username ${username}.`);
        } catch (err: any) {
            if (err.code === 'P2002') {
                const altUsername = username + Math.floor(Math.random() * 1000);
                await prisma.user.create({
                    data: {
                        email,
                        name,
                        username: altUsername,
                        passwordHash: hashedPassword,
                        tenantId,
                        role: "ADMIN",
                        isAdmin: true,
                        commissionLevel: "HIGH"
                    } as any
                });
                console.log(`Created new admin user ${email} with alternative username ${altUsername}.`);
            } else {
                throw err;
            }
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
