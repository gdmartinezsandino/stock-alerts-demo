import React from "react";
import { StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { colors, spacing } from "../theme";
import type { RootStackParamList } from "../navigation";

type Props = NativeStackScreenProps<RootStackParamList, "CreateAlert">;

export function CreateAlertScreen({ route }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>New alert</Text>
      <Text style={styles.body}>
        Prefill symbol: {route.params?.symbol ?? "(none)"} — form lands in the next commit.
      </Text>
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
