const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
userId: {
  type: mongoose.Schema.Types.ObjectId,
  required: [true, 'User ID is required.'],
  ref: 'User' // Reference to the User model
},
productsOrdered: [{
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
  required: [true, 'Sub total is required'],
  min: [0, 'Sub total must be non-negative.'] // Example of additional validation
  }
  }],	
totalPrice : {
type : Number,
required: [true, 'Total Price is required']
},
orderedOn : {
type : Date,
default: Date.now
},
status : {
type : String,
default : 'Pending'
}
});

module.exports = mongoose.model('Order', orderSchema);