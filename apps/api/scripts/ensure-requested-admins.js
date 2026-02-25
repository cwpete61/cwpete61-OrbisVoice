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
        }
        else {
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
                }
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
