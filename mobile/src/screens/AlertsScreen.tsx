import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../theme";

export function AlertsScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>Alerts</Text>
      <Text style={styles.body}>Alerts list lands in the next commits.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "700" },
  body: { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },
});
