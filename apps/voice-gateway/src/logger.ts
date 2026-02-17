import pino, { Logger } from "pino";
import { env } from "./env";

export const logger: Logger = pino(
  {
    level: env.NODE_ENV === "production" ? "info" : "debug",
  },
  env.NODE_ENV === "production"
    ? pino.destination()
    : pino.transport({
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      })
);
