import { registerRootComponent } from 'expo';
import React, { useEffect, useRef } from 'react';
import { LogBox } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  registerForPushNotifications,
  addNotificationListener,
  addResponseListener,
} from './src/services/notifications';
import { connectSocket, disconnectSocket } from './src/services/socket';

LogBox.ignoreLogs(['expo-notifications']);

const AppContent = () => {
  const { user } = useAuth();
  const notifListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (!user) return undefined;

    connectSocket();
    registerForPushNotifications();

    notifListener.current = addNotificationListener((notification) => {
      // eslint-disable-next-line no-console
      console.log('[Notification received]', notification.request.content);
    });

    responseListener.current = addResponseListener((response) => {
      const { data } = response.notification.request.content;
      // eslint-disable-next-line no-console
      console.log('[Notification tapped]', data);
    });

    return () => {
      disconnectSocket();
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user]);

  return (
    <>
      <StatusBar style="light" />
      <AppNavigator />
    </>
  );
};

const App = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

registerRootComponent(App);
