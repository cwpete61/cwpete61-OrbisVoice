
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

function loadEnv(filePath) {
    try {
        if (!fs.existsSync(filePath)) return;
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

// Load env from possible locations
loadEnv(path.join(__dirname, '../apps/api/.env'));
loadEnv(path.join(__dirname, '../.env'));

const prisma = new PrismaClient();

async function main() {
    const targetEmail = 'MyOrbisVoice@gmail.com';
    const targetUsername = 'Admin';
    const newPassword = 'Orbis@8214@@!!';

    console.log(`Setting up admin user: ${targetEmail}...`);

    // Hash password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find or create a tenant first
    let tenant = await prisma.tenant.findFirst({
        where: { name: 'OrbisVoice Admin' }
    });

    if (!tenant) {
        tenant = await prisma.tenant.findFirst(); // Fallback to any tenant
    }

    if (!tenant) {
        console.log("No tenant found. Creating OrbisVoice Admin tenant...");
        tenant = await prisma.tenant.create({
            data: {
                name: 'OrbisVoice Admin',
                usageLimit: 1000000,
                subscriptionTier: 'enterprise'
            }
        });
    }

    // Upsert the user
    const user = await prisma.user.upsert({
        where: { email: targetEmail },
        update: {
            passwordHash: hashedPassword,
            role: 'ADMIN',
            isAdmin: true,
            username: targetUsername
        },
        create: {
            email: targetEmail,
            name: 'OrbisVoice Admin',
            username: targetUsername,
            passwordHash: hashedPassword,
            role: 'ADMIN',
            isAdmin: true,
            tenantId: tenant.id
        }
    });

    console.log(`Successfully set up admin user: ${user.email}`);
    console.log(`User ID: ${user.id}`);
    console.log(`Tenant ID: ${user.tenantId}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
