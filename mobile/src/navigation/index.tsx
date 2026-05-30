import React from "react";
import { Pressable, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { LoginScreen } from "../screens/LoginScreen";
import { RegisterScreen } from "../screens/RegisterScreen";
import { StocksScreen } from "../screens/StocksScreen";
import { ChartsScreen } from "../screens/ChartsScreen";
import { AlertsScreen } from "../screens/AlertsScreen";
import { StockDetailScreen } from "../screens/StockDetailScreen";
import { CreateAlertScreen } from "../screens/CreateAlertScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Stocks: undefined;
  Charts: undefined;
  Alerts: undefined;
};

export type RootStackParamList = {
  Tabs: undefined;
  StockDetail: { symbol: string };
  CreateAlert: { symbol?: string };
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

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

function tabIcon(emoji: string) {
  // eslint-disable-next-line react/display-name
  return ({ focused }: { focused: boolean }) => (
    <Text style={{ fontSize: 18, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function LogoutButton() {
  const { logout } = useAuth();
  return (
    <Pressable onPress={logout} hitSlop={10} style={{ marginRight: 16 }}>
      <Text style={{ color: colors.accent, fontWeight: "600" }}>Logout</Text>
    </Pressable>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        headerRight: () => <LogoutButton />,
      }}
    >
      <Tab.Screen
        name="Stocks"
        component={StocksScreen}
        options={{ title: "Stocks", tabBarIcon: tabIcon("📋") }}
      />
      <Tab.Screen
        name="Charts"
        component={ChartsScreen}
        options={{ title: "Charts", tabBarIcon: tabIcon("📈") }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ title: "Alerts", tabBarIcon: tabIcon("🔔") }}
      />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { token, loading } = useAuth();
  if (loading) return null;

  return (
    <NavigationContainer theme={navTheme}>
      {token ? (
        <RootStack.Navigator screenOptions={screenOptions}>
          <RootStack.Screen name="Tabs" component={AppTabs} options={{ headerShown: false }} />
          <RootStack.Screen
            name="StockDetail"
            component={StockDetailScreen}
            options={{ title: "Stock" }}
          />
          <RootStack.Screen
            name="CreateAlert"
            component={CreateAlertScreen}
            options={{ title: "New alert", presentation: "modal" }}
          />
        </RootStack.Navigator>
      ) : (
        <AuthStack.Navigator screenOptions={screenOptions}>
          <AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
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
