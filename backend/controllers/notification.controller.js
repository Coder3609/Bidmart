const notificationService = require('../services/notification.service');
const { success } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await notificationService.listMine(req.user.id, { page, limit });
    return success(res, result, 'Notifications fetched.');
  } catch (err) {
    next(err);
  }
}

async function markRead(req, res, next) {
  try {
    await notificationService.markRead(req.user.id, req.params.id);
    return success(res, null, 'Notification marked as read.');
  } catch (err) {
    next(err);
  }
}

async function markAllRead(req, res, next) {
  try {
    await notificationService.markAllRead(req.user.id);
    return success(res, null, 'All notifications marked as read.');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, markRead, markAllRead };
