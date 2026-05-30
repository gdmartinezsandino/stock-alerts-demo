import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as api from "../api/client";
import { Stock } from "../types";
import { useLivePrices } from "../hooks/useLivePrices";
import { colors, radius, spacing } from "../theme";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, "Stocks">,
  NativeStackScreenProps<RootStackParamList>
>;

function fmt(n: number | null | undefined, digits = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return "—";
  return n.toFixed(digits);
}

export function StocksScreen({ navigation }: Props) {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const live = useLivePrices();

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await api.fetchStocks();
      setStocks(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Refresh the base quotes whenever the tab regains focus.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const renderItem = ({ item }: { item: Stock }) => {
    const livePrice = live[item.symbol];
    const price = livePrice?.price ?? item.price;
    const up = (item.percentChange ?? 0) >= 0;
    const tickColor =
      livePrice?.tick === "up"
        ? colors.up
        : livePrice?.tick === "down"
        ? colors.down
        : colors.text;

    return (
      <Pressable
        style={styles.row}
        onPress={() => navigation.navigate("StockDetail", { symbol: item.symbol })}
      >
        <View style={styles.symbolBadge}>
          <Text style={styles.symbolBadgeText}>{item.symbol.slice(0, 4)}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.muted}>
            H {fmt(item.high)} · L {fmt(item.low)}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[styles.price, { color: tickColor }]}>${fmt(price)}</Text>
          <Text style={[styles.change, { color: up ? colors.up : colors.down }]}>
            {up ? "▲" : "▼"} {fmt(item.percentChange)}%
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <FlatList
        data={stocks}
        keyExtractor={(s) => s.symbol}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={load}
            tintColor={colors.primary}
          />
        }
        ListHeaderComponent={
          <Text style={styles.header}>Live market — tap a stock for the chart</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { color: colors.textMuted, marginBottom: spacing.md, fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  symbolBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolBadgeText: { color: colors.accent, fontWeight: "800", fontSize: 12 },
  symbol: { color: colors.text, fontSize: 17, fontWeight: "700" },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  price: { fontSize: 17, fontWeight: "800" },
  change: { fontSize: 13, fontWeight: "600", marginTop: 2 },
  error: { color: colors.danger, padding: spacing.md },
});
