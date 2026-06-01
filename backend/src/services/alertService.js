import { Alert, User } from '../models/index.js';
import { sendNotification } from './firebaseService.js';

// Throttle: don't re-notify the same alert within 60 seconds
const notifiedAt = {};

const isThrottled = (id) => notifiedAt[id] && Date.now() - notifiedAt[id] < 60000;

const notifyAlert = async (alert, symbol, currentPrice) => {
  await alert.update({ triggered: true });
  notifiedAt[alert.id] = Date.now();

  const token = alert.User?.fcmToken;
  if (token) {
    await sendNotification(
      token,
      '📈 Stock Price Alert!',
      `${symbol} hit $${currentPrice.toFixed(2)} — your target was $${alert.targetPrice.toFixed(2)}`,
      { symbol, currentPrice: String(currentPrice), alertId: alert.id },
    );
  }
};

export const checkAlerts = async (symbol, currentPrice) => {
  try {
    const alerts = await Alert.findAll({
      where: { symbol, triggered: false, active: true },
      include: [{ model: User, attributes: ['fcmToken'] }],
    });

    const triggered = alerts.filter(
      (alert) => currentPrice >= alert.targetPrice && !isThrottled(alert.id),
    );

    await Promise.all(triggered.map((alert) => notifyAlert(alert, symbol, currentPrice)));
  } catch (err) {
    console.error('[AlertService] Error checking alerts:', err.message);
  }
};
