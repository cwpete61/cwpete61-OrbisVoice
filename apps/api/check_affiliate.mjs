import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const u = await p.user.findFirst({ where: { email: 'janesmith.partner@gmail.com' }, include: { affiliate: true } });
if (u) {
    console.log(JSON.stringify({ name: u.name, isAffiliate: u.isAffiliate, affiliateStatus: u.affiliate?.status, slug: u.affiliate?.slug, lockedRate: u.affiliate?.lockedCommissionRate }, null, 2));
} else {
    console.log('NOT FOUND');
}
await p.$disconnect();
