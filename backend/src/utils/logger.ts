/* Tiny structured-ish logger. Keeps output readable without a heavy dep. */

type Level = "info" | "warn" | "error" | "debug";

function emit(level: Level, scope: string, message: string, meta?: unknown) {
  const ts = new Date().toISOString();
  const base = `${ts} [${level.toUpperCase()}] (${scope}) ${message}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](base, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === "debug" ? "log" : level](base);
  }
}

export function createLogger(scope: string) {
  return {
    info: (msg: string, meta?: unknown) => emit("info", scope, msg, meta),
    warn: (msg: string, meta?: unknown) => emit("warn", scope, msg, meta),
    error: (msg: string, meta?: unknown) => emit("error", scope, msg, meta),
    debug: (msg: string, meta?: unknown) => {
      if (process.env.NODE_ENV === "development") emit("debug", scope, msg, meta);
    },
  };
}

export type Logger = ReturnType<typeof createLogger>;
