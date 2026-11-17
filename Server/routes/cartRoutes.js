const express    = require('express');
const router     = express.Router();
const auth       = require('../middleware/auth');
const {
  getCart, addToCart, updateCartItem, removeCartItem, removeCartByProduct, clearCart, metaCheckout, metaCheckoutPreview
} = require('../controllers/cartController');

router.get   ('/',        auth, getCart);
router.get('/meta-checkout-preview', metaCheckoutPreview); // no auth, before '/:itemId' routes
router.post  ('/',        auth, addToCart);
router.patch ('/:itemId', auth, updateCartItem);
router.delete('/product/:productId', auth, removeCartByProduct);
router.delete('/:itemId', auth, removeCartItem);
router.delete('/',        auth, clearCart);

router.post  ('/meta-checkout', auth, metaCheckout);
module.exports = router;