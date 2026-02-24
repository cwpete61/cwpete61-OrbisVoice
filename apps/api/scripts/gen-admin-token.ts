import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const p = new PrismaClient();

async function main() {
    // Get system admin user
    const admin = await p.user.findUnique({
        where: { email: "myorbislocal@gmail.com" }
    });

    if (!admin) {
        console.error("Admin not found!");
        return;
    }

    // Generate a JWT just like the API does
    const token = jwt.sign(
        { userId: admin.id, tenantId: admin.tenantId, email: admin.email },
        process.env.JWT_SECRET || "dev-secret-key-change-in-production",
        { expiresIn: "1h" }
    );

    console.log("==============");
    console.log("ADMIN TOKEN:");
    console.log(token);
    console.log("==============");
    console.log("Admin:", admin.email, "|", admin.role);
}

main()
    .catch(console.error)
    .finally(() => p.$disconnect());
