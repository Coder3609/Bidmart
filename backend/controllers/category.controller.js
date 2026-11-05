const categoryService = require('../services/category.service');
const { success } = require('../utils/apiResponse');

async function list(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    return success(res, categories, 'Categories fetched.');
  } catch (err) {
    next(err);
  }
}

module.exports = { list };
