// OrbisVoice Referrals Service

export async function main() {
  console.log("Referrals service initialized");
}

if (require.main === module) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
