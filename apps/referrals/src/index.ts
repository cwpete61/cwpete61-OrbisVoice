// OrbisVoice Referrals Service
import { logger } from "../../api/src/logger";

export async function main() {
  logger.info("Referrals service initialized");
}

if (require.main === module) {
  main().catch(err => {
    logger.error(err);
    process.exit(1);
  });
}
