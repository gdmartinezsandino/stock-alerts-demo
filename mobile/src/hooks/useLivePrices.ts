import { useEffect, useRef, useState } from "react";
import { onPrice, onSnapshot, reconnectWithFreshAuth } from "../services/socket";
import { PriceUpdate } from "../types";

export interface LivePrice {
  price: number;
  timestamp: number;
  /** direction of the most recent change, for flash colouring */
  tick: "up" | "down" | "flat";
}

/* Subscribes to the live price stream and returns a symbol -> LivePrice map
   that updates in place as ticks arrive. */
export function useLivePrices(): Record<string, LivePrice> {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const prevRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Ensure the socket carries the freshest auth token for this session.
    reconnectWithFreshAuth();

    const apply = (u: PriceUpdate) => {
      setPrices((curr) => {
        const prev = prevRef.current[u.symbol];
        const tick: LivePrice["tick"] =
          prev === undefined || prev === u.price
            ? "flat"
            : u.price > prev
            ? "up"
            : "down";
        prevRef.current[u.symbol] = u.price;
        return {
          ...curr,
          [u.symbol]: { price: u.price, timestamp: u.timestamp, tick },
        };
      });
    };

    const offSnapshot = onSnapshot((snapshot) => snapshot.forEach(apply));
    const offPrice = onPrice(apply);

    return () => {
      offSnapshot();
      offPrice();
    };
  }, []);

  return prices;
}
