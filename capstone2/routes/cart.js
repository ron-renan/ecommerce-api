const express = require('express');
const cartController = require('../controllers/cart');
const {verify, verifyAdmin} = require ("../auth");
const router = express.Router();

router.get("/", verify, cartController.getUserCart);

router.post("/addToCart", verify, cartController.addToCart);

router.patch("/updateQuantity", verify, cartController.updateCartItemQuantity);

router.delete("/:productId/removeFromCart", verify, cartController.removeFromCart);

router.delete("/clearCart", verify, cartController.clearCart);

router.post('/checkout', verify, cartController.checkout);

router.post('/checkout-item', verify, cartController.checkoutItem);

module.exports = router;