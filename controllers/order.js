const User = require('../models/User');
const Cart = require('../models/Cart')
const Order = require('../models/Order');


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

    // If the cart is empty after checkout, clear the cart
        if (cart.items.length === 0) {
            await Cart.findOneAndDelete({userId});
        } else {
            await cart.save();
        }

    return res.status(200).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports.getAllOrders = async (req, res) => {
     const orderId = req.orders;
    try {
        // Check if the user is an admin
        if (!req.user.isAdmin) {
            return res.status(403).json({ message: "Access denied. Unauthorized user." });
        }

        // Retrieve all orders
        const orders = await Order.find({}).populate('userId', 'username').populate('productsOrdered.productId', 'name' );

        return res.status(200).json(orders);
    } catch (error) {
       return res.status(500).json({ message: error.message });
    }
};
    

module.exports.getUserOrders = async (req, res) => {
    const {orderId, productId} = req.body;
    
    try {
    // Assuming user ID is available in req.user
     const userId = req.user.id;

    // Retrieve the user's order based on their user ID
    const userOrder = await Order.find({userId}).populate('productsOrdered.productId', 'name' );
    
    if (!userOrder) {
      return res.status(404).json({ message: 'No order found for this user' });
    }

        // If order found, return them
        return res.status(200).json({orders : userOrder});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports.getPendingOrders = async (req, res) => {
    const orderId = req.orders;
    try {
        // Check if user is admin
        if (!req.user || !req.user.isAdmin) {
            return res.status(403).json({ message: "Unauthorized access" });
        }

        // Retrieve all orders with pending status
        const pendingOrders = await Order.find({ status: 'Pending'}).populate('userId', 'user').populate('productsOrdered.productId', 'name' );

  
        return res.status(200).json({ orders: pendingOrders });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};



module.exports.updateOrderStatus = async (req, res) => {
    const { orderId, status } = req.body;
    const userId = req.user.id;

    try {
        const order = await Order.findOneAndUpdate(
            { _id: orderId, userId: userId },
            { $set: { status: status } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: "Order not found or unauthorized" });
        }

       return res.status(200).json({ message: "Order status updated successfully", order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
};