import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { createLogger } from "./utils/logger";

const log = createLogger("server");

async function main() {
  // Fail fast if the DB is unreachable.
  await prisma.$connect();
  log.info("Database connected");

  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(env.port, () => {
    log.info(`API listening on http://localhost:${env.port}`);
  });

  const shutdown = async (signal: string) => {
    log.info(`${signal} received, shutting down`);
    httpServer.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error("Fatal startup error", err);
  process.exit(1);
});
