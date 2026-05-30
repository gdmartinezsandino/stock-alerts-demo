import React, { useCallback, useState } from "react";
import {
  Alert as RNAlert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as api from "../api/client";
import { Alert } from "../types";
import { Button } from "../components/ui";
import { colors, radius, spacing } from "../theme";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AppTabParamList, RootStackParamList } from "../navigation";

type Props = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, "Alerts">,
  NativeStackScreenProps<RootStackParamList>
>;

export function AlertsScreen({ navigation }: Props) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAlerts(await api.fetchAlerts());
    } catch (e) {
      RNAlert.alert("Error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onDelete = (alert: Alert) => {
    RNAlert.alert("Delete alert", `Remove the ${alert.symbol} alert?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await api.deleteAlert(alert.id);
          load();
        },
      },
    ]);
  };

  const onReset = async (alert: Alert) => {
    await api.resetAlert(alert.id);
    load();
  };

  const renderItem = ({ item }: { item: Alert }) => {
    const triggered = item.status === "TRIGGERED";
    return (
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.muted}>
            Notify when price {item.direction === "ABOVE" ? "≥" : "≤"} $
            {item.targetPrice}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: spacing.xs }}>
          <View
            style={[
              styles.badge,
              { backgroundColor: triggered ? colors.surfaceAlt : colors.primaryDark },
            ]}
          >
            <Text style={styles.badgeText}>{triggered ? "Triggered" : "Active"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            {triggered ? (
              <Pressable onPress={() => onReset(item)}>
                <Text style={styles.action}>Re-arm</Text>
              </Pressable>
            ) : null}
            <Pressable onPress={() => onDelete(item)}>
              <Text style={[styles.action, { color: colors.danger }]}>Delete</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(a) => a.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>
            No alerts yet. Create one to get notified on price moves.
          </Text>
        }
      />
      <View style={styles.fabWrap}>
        <Button title="+ New alert" onPress={() => navigation.navigate("CreateAlert", {})} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  symbol: { color: colors.text, fontSize: 17, fontWeight: "800" },
  muted: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { color: colors.text, fontSize: 11, fontWeight: "700" },
  action: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xl },
  fabWrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
  },
});
