const express = require('express');
const router  = express.Router();
const { getCategoryTree, getCategoriesFlat } = require('../controllers/categoryController');
router.get('/categories/tree', getCategoryTree);
router.get('/categories',      getCategoriesFlat);
module.exports = router;