const categoryModel = require('../models/category.model');

async function listCategories() {
  return categoryModel.findAll();
}

module.exports = { listCategories };
