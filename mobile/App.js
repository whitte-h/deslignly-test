import React, { useEffect, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { LogBox } from 'react-native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import {
  registerForPushNotifications,
  addNotificationListener,
  addResponseListener,
} from './src/services/notifications';
import { connectSocket, disconnectSocket } from './src/services/socket';

// Silence non-critical expo-notifications warnings in dev
LogBox.ignoreLogs(['expo-notifications']);

function AppContent() {
  const { user } = useAuth();
  const notifListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (!user) return;

    // Connect Socket.io
    connectSocket();

    // Register for FCM / push notifications
    registerForPushNotifications();

    // Handle foreground notifications
    notifListener.current = addNotificationListener((notification) => {
      console.log('[Notification received]', notification.request.content);
    });

    // Handle notification tap
    responseListener.current = addResponseListener((response) => {
      const data = response.notification.request.content.data;
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
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
