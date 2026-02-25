import { prisma } from "../src/db";
import * as bcrypt from "bcryptjs";

async function main() {
    const email = "myorbislocal@gmail.com";
    const password = "Orbis@8214@@!!";

    console.log(`Setting password for ${email}...`);

    try {
        const passwordHash = await bcrypt.hash(password, 10);

        // Find or create user
        const user = await prisma.user.upsert({
            where: { email },
            update: {
                passwordHash,
                isAdmin: true,
                role: "SYSTEM_ADMIN"
            },
            create: {
                email,
                name: "System Admin",
                username: "systemadmin",
                passwordHash,
                isAdmin: true,
                role: "SYSTEM_ADMIN",
                tenantId: "admin-tenant-001" // Use existing admin tenant
            }
        });

        console.log(`Successfully updated/created user ${user.id} (${user.email})`);
        console.log(`Role: ${user.role}, isAdmin: ${user.isAdmin}`);
    } catch (err) {
        console.error("Failed to set password:", err);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
