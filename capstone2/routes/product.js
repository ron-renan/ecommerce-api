const express = require('express');
const productController = require('../controllers/product');
const {verify, verifyAdmin} = require ("../auth");
const router = express.Router();

router.post("/", verify, verifyAdmin, productController.createProduct);

router.get("/all",verify, verifyAdmin, productController.getAllProducts);

router.get("/active", productController.getActiveProduct);

router.get("/:productId", productController.getProduct);

router.patch('/:productId/update', verify, verifyAdmin, productController.updateProduct);

router.patch('/:productId/archive', verify, verifyAdmin, productController.archiveProduct);

router.patch('/:productId/activate', verify, verifyAdmin, productController.activateProduct);

router.post('/searchByName', productController.searchProductByName);

router.post('/searchByPrice', productController.searchProductByPriceRange);

module.exports = router;