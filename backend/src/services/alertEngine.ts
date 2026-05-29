import { prisma } from "../config/prisma";
import { createLogger } from "../utils/logger";
import { priceFeed } from "./priceFeed";
import { sendPush } from "./fcm";
import { PriceUpdate } from "./finnhubSocket";

const log = createLogger("alert-engine");

/* Listens to the price feed and fires FCM notifications when an active alert's
   condition is met:
     - ABOVE: price >= targetPrice
     - BELOW: price <= targetPrice
   A fired alert is marked TRIGGERED so it only notifies once. */
export function startAlertEngine() {
  priceFeed.on("price", (update: PriceUpdate) => {
    void evaluate(update).catch((err) =>
      log.error("Alert evaluation failed", (err as Error).message)
    );
  });
  log.info("Alert engine started");
}

async function evaluate(update: PriceUpdate) {
  const { symbol, price } = update;

  const alerts = await prisma.alert.findMany({
    where: { symbol: symbol.toUpperCase(), status: "ACTIVE" },
    include: { user: { include: { deviceTokens: true } } },
  });
  if (alerts.length === 0) return;

  for (const alert of alerts) {
    const conditionMet =
      alert.direction === "ABOVE"
        ? price >= alert.targetPrice
        : price <= alert.targetPrice;
    if (!conditionMet) continue;

    // Mark triggered first (idempotency guard against rapid repeated ticks).
    const updated = await prisma.alert.updateMany({
      where: { id: alert.id, status: "ACTIVE" },
      data: { status: "TRIGGERED", triggeredAt: new Date() },
    });
    if (updated.count === 0) continue; // another tick won the race

    const tokens = alert.user.deviceTokens.map((d) => d.token);
    const arrow = alert.direction === "ABOVE" ? "above" : "below";
    log.info("Alert triggered", {
      alertId: alert.id,
      symbol,
      price,
      target: alert.targetPrice,
    });

    const { invalidTokens } = await sendPush(tokens, {
      title: `${symbol} price alert`,
      body: `${symbol} is ${arrow} your target of $${alert.targetPrice}. Now $${price.toFixed(
        2
      )}.`,
      data: {
        type: "price_alert",
        alertId: alert.id,
        symbol,
        price: String(price),
        target: String(alert.targetPrice),
      },
    });

    if (invalidTokens.length > 0) {
      await prisma.deviceToken.deleteMany({ where: { token: { in: invalidTokens } } });
    }
  }
}
