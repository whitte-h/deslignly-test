const { Alert, User } = require('../models');
const { sendNotification } = require('./firebaseService');

// Throttle: don't re-notify the same alert within 60 seconds
const notifiedAt = {};

const checkAlerts = async (symbol, currentPrice) => {
  try {
    const alerts = await Alert.findAll({
      where: { symbol, triggered: false, active: true },
      include: [{ model: User, attributes: ['fcmToken'] }],
    });

    for (const alert of alerts) {
      if (currentPrice < alert.targetPrice) continue;

      const key = alert.id;
      if (notifiedAt[key] && Date.now() - notifiedAt[key] < 60000) continue;

      await alert.update({ triggered: true });
      notifiedAt[key] = Date.now();

      const token = alert.User?.fcmToken;
      if (token) {
        await sendNotification(
          token,
          '📈 Stock Price Alert!',
          `${symbol} hit $${currentPrice.toFixed(2)} — your target was $${alert.targetPrice.toFixed(2)}`,
          { symbol, currentPrice: String(currentPrice), alertId: alert.id }
        );
      }
    }
  } catch (err) {
    console.error('[AlertService] Error checking alerts:', err.message);
  }
};

module.exports = { checkAlerts };
