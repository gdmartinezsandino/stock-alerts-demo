import { createServer } from "http";
import { createApp } from "./app";
import { env } from "./config/env";
import { createLogger } from "./utils/logger";

const log = createLogger("server");

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  httpServer.listen(env.port, () => {
    log.info(`API listening on http://localhost:${env.port}`);
  });

  const shutdown = (signal: string) => {
    log.info(`${signal} received, shutting down`);
    httpServer.close(() => process.exit(0));
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  log.error("Fatal startup error", err);
  process.exit(1);
});
