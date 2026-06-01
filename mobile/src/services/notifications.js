import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authAPI } from '../api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices');
    return null;
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('Notification permission denied');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('stock_alerts', {
      name: 'Stock Price Alerts',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#00D09C',
      sound: true,
    });
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const token = projectId
    ? (await Notifications.getExpoPushTokenAsync({ projectId })).data
    : (await Notifications.getDevicePushTokenAsync()).data;

  try {
    await authAPI.updateFcmToken(token);
  } catch (err) {
    console.warn('Failed to send FCM token to server:', err.message);
  }

  return token;
};

export const addNotificationListener = (handler) => Notifications.addNotificationReceivedListener(handler);

export const addResponseListener = (handler) => Notifications.addNotificationResponseReceivedListener(handler);
