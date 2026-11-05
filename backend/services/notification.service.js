const notificationModel = require('../models/notification.model');

async function listMine(userId, query) {
  const { page, limit } = query;
  return notificationModel.listByUser(userId, { page, limit });
}

// markRead/markAllRead are scoped to userId inside the model's WHERE clause,
// so there's nothing extra to check here — a user can never mark someone
// else's notification read, the UPDATE simply matches zero rows.
async function markRead(userId, id) {
  await notificationModel.markRead(userId, id);
}

async function markAllRead(userId) {
  await notificationModel.markAllRead(userId);
}

module.exports = { listMine, markRead, markAllRead };
