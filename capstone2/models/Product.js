const mongoose = require("mongoose");
const productSchema = new mongoose.Schema({
	Name : {
		type : String,
		required: [true, 'Product name is required']
	},
	Description : {
		type : String,
		required: [true, 'Description is required']
	},
	Price : {
		type : Number,
		required: [true, 'Price is required']
	},
	isActive : {
		type : Boolean,
		default: true
	},
	createdOn : {
		type : Date,
		default: Date.now
	}

});

module.exports = mongoose.model('Product', productSchema);