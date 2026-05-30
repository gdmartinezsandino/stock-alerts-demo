import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as api from "../api/client";
import { CandlePoint } from "../types";
import { LineChart } from "../components/LineChart";
import { Button } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import { useLivePrices } from "../hooks/useLivePrices";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "StockDetail">;

const width = Dimensions.get("window").width - spacing.md * 2;

export function StockDetailScreen({ route, navigation }: Props) {
  const { symbol } = route.params;
  const [history, setHistory] = useState<CandlePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const live = useLivePrices();
  const livePrice = live[symbol]?.price;

  useEffect(() => {
    navigation.setOptions({ title: symbol });
    (async () => {
      const h = await api.fetchHistory(symbol).catch(() => []);
      setHistory(h);
      setLoading(false);
    })();
  }, [symbol, navigation]);

  const data = history.map((h) => h.c);
  // Append the live price so the chart tracks the latest tick.
  if (livePrice) data.push(livePrice);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.symbol}>{symbol}</Text>
        <Text style={styles.price}>
          ${livePrice ? livePrice.toFixed(2) : data.length ? data[data.length - 1].toFixed(2) : "—"}
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
        ) : (
          <LineChart data={data} width={width - spacing.md * 2} height={180} />
        )}
      </View>

      <Button
        title={`Create alert for ${symbol}`}
        onPress={() => navigation.navigate("CreateAlert", { symbol })}
        style={{ marginTop: spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  symbol: { color: colors.textMuted, fontSize: 16, fontWeight: "700" },
  price: { color: colors.text, fontSize: 34, fontWeight: "900", marginVertical: spacing.sm },
});
