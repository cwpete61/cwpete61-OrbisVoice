"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
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
    }
    else {
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
                }
            });
            console.log(`Created new admin user ${email} with username ${username}.`);
        }
        catch (err) {
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
                    }
                });
                console.log(`Created new admin user ${email} with alternative username ${altUsername}.`);
            }
            else {
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
