import pino from "pino";

export const logger = pino(
  process.env.NODE_ENV === "production"
    ? undefined
    : {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: false,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
);
