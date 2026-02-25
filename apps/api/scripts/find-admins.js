"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const p = new client_1.PrismaClient();
p.user.findMany({
    where: { OR: [{ isAdmin: true }, { role: "ADMIN" }, { role: "SYSTEM_ADMIN" }] },
    select: { email: true, name: true, role: true, isAdmin: true }
}).then((users) => {
    console.log(JSON.stringify(users, null, 2));
    return p.$disconnect();
});
