import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { Button, Field } from "../components/ui";
import { colors, spacing } from "../theme";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../navigation";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@designli.co");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.logo}>📈 Stock Alerts</Text>
        <Text style={styles.subtitle}>Real-time prices & price alerts</Text>

        <View style={{ height: spacing.xl }} />

        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Field
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Log in" onPress={onSubmit} loading={loading} />
        <View style={{ height: spacing.sm }} />
        <Button
          title="Create an account"
          variant="ghost"
          onPress={() => navigation.navigate("Register")}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, justifyContent: "center", flexGrow: 1 },
  logo: { color: colors.text, fontSize: 30, fontWeight: "800", textAlign: "center" },
  subtitle: { color: colors.textMuted, textAlign: "center", marginTop: spacing.xs },
  error: { color: colors.danger, marginBottom: spacing.md },
});
