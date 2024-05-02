const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order');
const {verify, verifyAdmin} = require ("../auth");

router.post('/checkout', verify, orderController.checkout);

router.get('/all-orders', verify, verifyAdmin, orderController.getAllOrders);

router.get('/my-orders', verify, orderController.getUserOrders);

router.post('/pending-orders', verify, verifyAdmin, orderController.getPendingOrders);

router.patch('/updateOrderStatus', verify, orderController.updateOrderStatus);

module.exports = router;