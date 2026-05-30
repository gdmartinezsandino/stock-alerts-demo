import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as api from "../api/client";
import { Stock } from "../types";
import { LineChart } from "../components/LineChart";
import { colors, radius, spacing } from "../theme";

interface SeriesMap {
  [symbol: string]: number[];
}

const screenWidth = Dimensions.get("window").width;
const CARD_WIDTH = screenWidth - spacing.md * 2;

/* "Graphic of all Stocks": one chart card per tracked symbol. History is
   pulled from the backend (/stocks/:symbol/history). */
export function ChartsScreen() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [series, setSeries] = useState<SeriesMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const list = await api.fetchStocks();
      setStocks(list);
      const entries = await Promise.all(
        list.map(async (s) => {
          const history = await api.fetchHistory(s.symbol).catch(() => []);
          return [s.symbol, history.map((h) => h.c)] as const;
        })
      );
      setSeries(Object.fromEntries(entries));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: spacing.md }}
      refreshControl={
        <RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />
      }
    >
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {stocks.map((s) => {
        const data = series[s.symbol] ?? [];
        const up = (s.percentChange ?? 0) >= 0;
        return (
          <View key={s.symbol} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.symbol}>{s.symbol}</Text>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.price}>
                  ${s.price !== null ? s.price.toFixed(2) : "—"}
                </Text>
                <Text style={{ color: up ? colors.up : colors.down, fontSize: 12 }}>
                  {up ? "▲" : "▼"} {s.percentChange?.toFixed(2) ?? "—"}%
                </Text>
              </View>
            </View>
            <LineChart
              data={data}
              width={CARD_WIDTH - spacing.md * 2}
              height={90}
              color={up ? colors.up : colors.down}
            />
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  symbol: { color: colors.text, fontSize: 18, fontWeight: "800" },
  price: { color: colors.text, fontSize: 16, fontWeight: "700" },
  error: { color: colors.danger, marginBottom: spacing.md },
});
