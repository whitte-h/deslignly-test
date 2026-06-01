import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import StocksScreen from '../screens/StocksScreen';
import StockDetailScreen from '../screens/StockDetailScreen';
import AlertsScreen from '../screens/AlertsScreen';
import CreateAlertScreen from '../screens/CreateAlertScreen';
import { COLORS } from '../utils/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Stocks: 'stats-chart',
  Alerts: 'notifications',
};

const screenOptions = ({ route }) => ({
  tabBarIcon: ({ color, size }) => (
    <Ionicons name={TAB_ICONS[route.name]} size={size} color={color} />
  ),
  tabBarActiveTintColor: COLORS.up,
  tabBarInactiveTintColor: COLORS.muted,
  tabBarStyle: { backgroundColor: COLORS.surface, borderTopColor: COLORS.border },
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { fontWeight: '700' },
});

const stackHeaderOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
};

const StocksStack = () => (
  <Stack.Navigator screenOptions={stackHeaderOptions}>
    <Stack.Screen name="StocksList" component={StocksScreen} options={{ title: 'Markets' }} />
    <Stack.Screen
      name="StockDetail"
      component={StockDetailScreen}
      options={({ route }) => ({ title: route.params.symbol })}
    />
  </Stack.Navigator>
);

const AlertsStack = () => (
  <Stack.Navigator screenOptions={stackHeaderOptions}>
    <Stack.Screen name="AlertsList" component={AlertsScreen} options={{ title: 'Price Alerts' }} />
    <Stack.Screen
      name="CreateAlert"
      component={CreateAlertScreen}
      options={{ title: 'New Alert', presentation: 'modal' }}
    />
  </Stack.Navigator>
);

const MainTabs = () => (
  <Tab.Navigator screenOptions={screenOptions}>
    <Tab.Screen name="Stocks" component={StocksStack} options={{ headerShown: false }} />
    <Tab.Screen name="Alerts" component={AlertsStack} options={{ headerShown: false }} />
  </Tab.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

export const AppNavigator = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.up} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={{ colors: { background: COLORS.bg } }}>
      {user ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};
