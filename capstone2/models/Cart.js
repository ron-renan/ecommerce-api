const mongoose = require("mongoose");
const cartSchema = new mongoose.Schema({

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'User ID is required.'],
    ref: 'User' // Reference to the User model
  },
  items: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        required: [true, 'Product ID is required.'],
        ref: 'Product' // Reference to the Product model
      },
      quantity: {
        type: Number,
        required: [true, 'Quantity is required.'],
        min: [1, 'Quantity must be at least 1.'] // Example of additional validation
      },
      subTotal: {
        type: Number,
        required: [true, 'Subtotal is required.'],
        min: [0, 'Subtotal must be non-negative.'] // Example of additional validation
      }
    }
  ],
  totalPrice: {
    type: Number,
    required: [true, 'Total price is required.'],
    min: [0, 'Total price must be non-negative.'] // Example of additional validation
  },
  orderedOn: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Cart', cartSchema);