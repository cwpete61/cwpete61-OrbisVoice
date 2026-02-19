
const { PrismaClient } = require('@prisma/client');
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
    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isAdmin: true
        }
    });
    console.log(JSON.stringify(users, null, 2));
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
