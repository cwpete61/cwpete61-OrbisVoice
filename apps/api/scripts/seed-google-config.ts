import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI || "https://myorbisvoice.com/auth/google/calendar/callback";

  if (!clientId || !clientSecret) {
    console.error(
      "Error: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables must be set"
    );
    process.exit(1);
  }

  console.log("Seeding Google Auth Config...");
  const config = await prisma.googleAuthConfig.upsert({
    where: { id: "google-auth-config" },
    update: {
      clientId,
      clientSecret,
      redirectUri,
      enabled: true,
    },
    create: {
      id: "google-auth-config",
      clientId,
      clientSecret,
      redirectUri,
      enabled: true,
    },
  });

  console.log("Final config seeded:", JSON.stringify(config, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
