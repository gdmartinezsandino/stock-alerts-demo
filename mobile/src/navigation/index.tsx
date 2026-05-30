import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  contentStyle: { backgroundColor: colors.bg },
} as const;

function MainPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderTitle}>Signed in</Text>
      <Text style={styles.placeholderBody}>
        Stocks, charts and alerts will live here once the main navigation lands.
      </Text>
    </View>
  );
}

export function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      {token ? (
        <MainPlaceholder />
      ) : (
        <AuthStack.Navigator screenOptions={screenOptions}>
          <AuthStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <AuthStack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: "Register" }}
          />
        </AuthStack.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  placeholderTitle: { color: colors.text, fontSize: 22, fontWeight: "700" },
  placeholderBody: { color: colors.textMuted, marginTop: spacing.sm, textAlign: "center" },
});
