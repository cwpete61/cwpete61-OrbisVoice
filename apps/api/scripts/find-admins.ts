import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.user.findMany({
    where: { OR: [{ isAdmin: true }, { role: "ADMIN" }, { role: "SYSTEM_ADMIN" }] },
    select: { email: true, name: true, role: true, isAdmin: true }
}).then((users: any[]) => {
    console.log(JSON.stringify(users, null, 2));
    return p.$disconnect();
});
