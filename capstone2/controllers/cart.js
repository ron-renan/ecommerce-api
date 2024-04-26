const Cart = require('../models/Cart');
const Product = require('../models/Product');
const User = require('../models/User')
const Order = require('../models/Order')
// Controller function to retrieve user's cart
module.exports.getUserCart = async (req, res) => {
  try {
    // Assuming user ID is available in req.user
    const userId = req.user.id;

    // Retrieve the user's cart based on their user ID
    const userCart = await Cart.findOne({ userId });

    if (!userCart) {
      return res.status(404).json({ message: 'Cart not found for this user' });
    }

    // Send the user's cart as a response
    res.status(200).json(userCart);
  } catch (error) {
    console.error('Error retrieving user cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller function to add an item to the user's cart
module.exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // Find the user's cart based on their user ID
    let userCart = await Cart.findOne({ userId });

    // If the user's cart doesn't exist, create a new one
    if (!userCart) {
      userCart = new Cart({ userId, items: [] });
    }

    // Check if the product exists
    const productToCart = await Product.findById(productId);

    // If the product doesn't exist, return an error response
    if (!productToCart) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Calculate the subtotal
    const subTotal = productToCart.price * quantity;

    // Check if the item is already in the cart
    const existingItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);

    // If the item is already in the cart, update its quantity and subtotal
    if (existingItemIndex !== -1) {
      userCart.items[existingItemIndex].quantity += quantity;
      userCart.items[existingItemIndex].subTotal += subTotal;
    } else {
      // Otherwise, add the new item to the cart
      userCart.items.push({ productId, quantity, subTotal });
    }

    // Calculate the total price
    let totalPrice = 0;
    userCart.items.forEach(item => {
      totalPrice += item.subTotal;
    });

    // Update the total price in the cart
    userCart.totalPrice = totalPrice;

    // Save the updated cart to the database
    await userCart.save();

    // Send a success response
    res.status(200).json({ message: 'Item added to cart successfully', cart: userCart });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.updateCartItemQuantity = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    // Find the user's cart based on their user ID
    let userCart = await Cart.findOne({ userId });

    // If the user's cart doesn't exist, return an error response
    if (!userCart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    // Check if the item is already in the cart
    const existingItemIndex = userCart.items.findIndex(item => item.productId.toString() === productId);
    console.log(userCart.items);

    // If the item is not in the cart, return an error response
    if (existingItemIndex === -1) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }

    // Update the quantity of the item
    userCart.items[existingItemIndex].quantity = quantity;

    // Calculate the new subtotal for the item
    const product = await Product.findById(productId);
    const newSubTotal = product.price * quantity;
    userCart.items[existingItemIndex].subTotal = newSubTotal;

    // Calculate the new total price for the cart
    let totalPrice = 0;
    userCart.items.forEach(item => {
      totalPrice += item.subTotal;
    });
    userCart.totalPrice = totalPrice;

    // Save the updated cart to the database
    await userCart.save();

    // Send a success response
    res.status(200).json({ message: 'Cart item quantity updated successfully', cart: userCart });
  } catch (error) {
    console.error('Error updating cart item quantity:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


exports.removeFromCart = async (req, res) => {
  try {
    // Check if the user is authenticated
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if the user is an admin
    if (user.isAdmin === true) {
      return res.status(403).json({ message: 'Admin cannot remove items from cart' });
    }

    // Find the user's cart
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found for the user' });
    }

    const productId = req.params.productId;

    // Check if the product exists in the cart
    const productIndex = cart.items.findIndex(item => item.productId.toString() === productId);
    if (productIndex === -1) {
      return res.status(404).json({ message: 'Product not found in the cart' });
    }

    // Remove the product from the cart
    cart.items.splice(productIndex, 1);

    // Calculate the new total price for the cart
    let totalPrice = 0;
    cart.items.forEach(item => {
      totalPrice += item.subTotal;
    });
    cart.totalPrice = totalPrice;

    // Save the updated cart
    await cart.save();

    res.json({ message: 'Product removed from the cart successfully', cart: cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
module.exports.clearCart = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in request after authentication middleware

  try {
    // Find the user's cart and clear it
    const cart = await Cart.findOneAndUpdate(
      {userId },
      { $set: { items: [] }, totalPrice: 0, orderedOn: undefined },
      { new: true }
    );

    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    res.status(200).json({ message: 'Cart cleared successfully', cart });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller function to check out the cart and add an order record
module.exports.checkout = async (req, res) => {
  const userId = req.user.id; // Assuming user ID is available in request after authentication middleware

  try {
    // Find the user's cart
    const cart = await Cart.findOne({userId }).populate('items');

    // If cart is empty, return response
    if (!cart || cart.items.length === 0) {
      return res.status(404).json({ message: 'Cart is empty' });
    }

    // Calculate total price and create order
    const totalPrice = cart.items.reduce((total, item) => total + item.subTotal, 0);
    const productsOrdered = cart.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      subTotal: item.subTotal
    }));

    // Create order
    const newOrder = new Order({
      userId: userId,
      productsOrdered: productsOrdered,
      totalPrice: totalPrice
    });
    
    await newOrder.save();

    // Clear the cart
    await Cart.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalPrice: 0, orderedOn: undefined } }
    );

    res.status(200).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


// Controller function to checkout an item from the user's cart
exports.checkoutItem = async (req, res) => {
    try {
        // Extract product id and quantity from request body
        const { productId, quantity } = req.body;

        // Retrieve authenticated user id from token
        const userId = req.user.id;

        // Check if the user is admin
        const user = await User.findById(userId);
        if (req.user.isAdmin) {
            return res.status(403).json({ error: 'Admin user cannot checkout items' });
        }

        // Find the user's cart based on their user ID
    let cart = await Cart.findOne({ userId });


        // Check if the product exists in the cart
        const index = cart.items.findIndex(item => item.productId.toString() === productId);
        if (index === -1) {
            return res.status(404).json({ error: 'Product not found in the cart' });
        }

        // Check if the quantity in the cart is sufficient
        if (cart.items[index].quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient quantity in the cart' });
        }
       

        // Calculate subtotal and update cart
        const product = await Product.findById(productId);
        cart.items[index].quantity -= quantity;
        const subTotal = cart.items[index].quantity * product.price;
        cart.items[index].subTotal -= subTotal;

        //Calculate total price and update cart
        let totalPrice = 0;
        cart.items.forEach(item => {
        totalPrice += item.subTotal;
        });
        cart.totalPrice = totalPrice;

        // Update user's cart
        user.cart = cart;
        await user.save();

        // Create order record
        const order = new Order({
            userId,
            productsOrdered: [{ productId, quantity, subTotal }],
            totalPrice
        });
        await order.save();

        res.status(200).json({ message: 'Order placed successfully', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
};