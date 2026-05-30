import React, { useEffect, useState } from "react";
import {
  Alert as RNAlert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as api from "../api/client";
import { AlertDirection, Stock } from "../types";
import { Button, Field } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateAlert">;

export function CreateAlertScreen({ route, navigation }: Props) {
  const presetSymbol = route.params?.symbol;
  const [symbol, setSymbol] = useState(presetSymbol ?? "");
  const [targetPrice, setTargetPrice] = useState("");
  const [direction, setDirection] = useState<AlertDirection>("ABOVE");
  const [symbols, setSymbols] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(false);

  // Offer the tracked universe as quick-pick chips.
  useEffect(() => {
    api.fetchStocks().then(setSymbols).catch(() => undefined);
  }, []);

  const onSubmit = async () => {
    const price = parseFloat(targetPrice);
    if (!symbol.trim()) return RNAlert.alert("Validation", "Choose a stock symbol.");
    if (!price || price <= 0)
      return RNAlert.alert("Validation", "Enter a valid target price.");

    setLoading(true);
    try {
      await api.createAlert({
        symbol: symbol.trim().toUpperCase(),
        targetPrice: price,
        direction,
      });
      RNAlert.alert("Alert created", `We'll notify you when ${symbol.toUpperCase()} crosses $${price}.`);
      navigation.goBack();
    } catch (e) {
      RNAlert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.md }}>
      <Field
        label="Stock symbol"
        value={symbol}
        onChangeText={(t) => setSymbol(t.toUpperCase())}
        autoCapitalize="characters"
        placeholder="AAPL"
      />

      <Text style={styles.label}>Quick pick</Text>
      <View style={styles.chips}>
        {symbols.map((s) => (
          <Pressable
            key={s.symbol}
            onPress={() => setSymbol(s.symbol)}
            style={[
              styles.chip,
              symbol === s.symbol && { backgroundColor: colors.primaryDark, borderColor: colors.primary },
            ]}
          >
            <Text style={styles.chipText}>{s.symbol}</Text>
          </Pressable>
        ))}
      </View>

      <Field
        label="Target price ($)"
        value={targetPrice}
        onChangeText={setTargetPrice}
        keyboardType="decimal-pad"
        placeholder="250.00"
      />

      <Text style={styles.label}>Notify me when price is</Text>
      <View style={styles.directionRow}>
        {(["ABOVE", "BELOW"] as AlertDirection[]).map((d) => (
          <Pressable
            key={d}
            onPress={() => setDirection(d)}
            style={[
              styles.directionBtn,
              direction === d && { backgroundColor: colors.primaryDark, borderColor: colors.primary },
            ]}
          >
            <Text style={styles.directionText}>
              {d === "ABOVE" ? "▲ At or above" : "▼ At or below"}
            </Text>
          </Pressable>
        ))}
      </View>

      <Button title="Create alert" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.lg }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { color: colors.textMuted, marginBottom: spacing.sm, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  directionRow: { flexDirection: "row", gap: spacing.sm },
  directionBtn: {
    flex: 1,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  directionText: { color: colors.text, fontWeight: "700" },
});
