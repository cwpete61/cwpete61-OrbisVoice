
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

function loadEnv(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        content.split('\n').forEach(line => {
            const parts = line.split('=');
            if (parts.length >= 2 && !line.startsWith('#')) {
                const key = parts[0].trim();
                const value = parts.slice(1).join('=').trim();
                if (!process.env[key]) {
                    process.env[key] = value;
                }
            }
        });
    } catch (err) {
        console.error("Could not load env file:", filePath);
    }
}

loadEnv(path.join(__dirname, '../apps/api/.env'));

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'admin@orbisvoice.com'; // Adjust if needed based on list-users output
    const targetUsername = '0Admin';
    const newPassword = 'Orbis@8214@@!!';

    console.log(`Updating admin user...`);

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find user (we'll look for admin role or create if not exists, but better to update existing)
    // Based on the user request, they want to update "Admin". I'll look for an admin user.

    // First, let's try to find a user with role ADMIN
    const adminUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
    });

    if (adminUser) {
        console.log(`Found admin user: ${adminUser.email} (${adminUser.id})`);
        const updated = await prisma.user.update({
            where: { id: adminUser.id },
            data: {
                username: targetUsername,
                passwordHash: hashedPassword,
                // Ensure role is ADMIN just in case
                role: 'ADMIN',
                isAdmin: true
            }
        });
        console.log(`Updated user ${updated.email} with new username '${updated.username}' and password.`);
    } else {
        console.log("No ADMIN user found. Creating new admin user...");

        // Find or create a tenant first
        let tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.log("No tenant found. Creating default tenant...");
            tenant = await prisma.tenant.create({
                data: {
                    name: 'Default Organization',
                    usageLimit: 1000,
                    subscriptionTier: 'enterprise'
                }
            });
            console.log(`Created tenant: ${tenant.id}`);
        }

        // Create the admin user
        const newUser = await prisma.user.create({
            data: {
                email: targetEmail,
                username: targetUsername,
                passwordHash: hashedPassword,
                name: 'Admin User',
                role: 'ADMIN',
                isAdmin: true,
                tenantId: tenant.id
            }
        });
        console.log(`Created new admin user: ${newUser.email} (${newUser.id})`);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
