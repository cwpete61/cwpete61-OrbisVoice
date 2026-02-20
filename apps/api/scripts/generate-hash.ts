import bcrypt from "bcryptjs";

async function generateHash() {
  const password = "Orbis@8214@@!!";
  const hash = await bcrypt.hash(password, 10);
  console.log("Password hash:", hash);
}

generateHash().catch(console.error);
