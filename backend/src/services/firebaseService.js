import admin from 'firebase-admin';

let initialized = false;

const init = () => {
  if (initialized) return;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    console.warn('[Firebase] Credentials not set — FCM notifications disabled');
    return;
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
  initialized = true;
  console.log('[Firebase] Admin SDK initialized');
};

export const sendNotification = async (fcmToken, title, body, data = {}) => {
  init();
  if (!initialized) return null;

  const message = {
    token: fcmToken,
    notification: { title, body },
    data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    android: { priority: 'high', notification: { sound: 'default', channelId: 'stock_alerts' } },
    apns: { payload: { aps: { sound: 'default', badge: 1 } } },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('[Firebase] Notification sent:', response);
    return response;
  } catch (err) {
    console.error('[Firebase] Send error:', err.message);
    return null;
  }
};
