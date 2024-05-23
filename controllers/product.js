const Product = require ("../models/Product");
const User = require ("../models/User");
const auth = require("../auth");

module.exports.createProduct = (req, res) => {
   
    const newProduct = new Product({
    name : req.body.name,
    description : req.body.description,
    price : req.body.price
    });
	Product.findOne({name: req.body.name})
	.then(existingProduct =>{
    if(existingProduct){
        return res.status(409).send({error: 'Product already exists'})
    }
    return newProduct.save()
        .then(savedProduct => {
            return res.status(201).send({savedProduct, message:'You have successfully added a product.'})
        })
        .catch(saveErr => {
            console.error("Error in saving the product:", saveErr)
            return res.status(500).send({error: 'Failed to save the product.'})
        })
    })
    .catch(findErr =>{
        console.error("Error in finding the product:", findErr)
        return res.status(500).send({message: "Error finding the product"});
    })

}

module.exports.getAllProducts = (req, res) => {

    return Product.find({})
        .then(products => {
            if (products.length > 0){
               return res.status(200).send(products)
            }else{
                return res.status(404).send({message: 'No product found.'})
            }            
        })
        .catch(err => {
            console.error("Error in finding all products:", err)
           return res.status(500).send({error: 'Error finding all products'});
    })
}
     
        
module.exports.getActiveProduct = (req, res) => {
    
    return Product.find({isActive: true})
    .then(products => {
        if(products.length > 0){
           return res.status(200).send({products});
        }else{
           return res.status(404).send({message: 'No active product found.'}) ;
        }
    })
    .catch(err =>{
        console.log('Error in finding active products:', err)
        return res.status(500).send({error: 'Error finding active products'});
    }) 
}


module.exports.getProduct = (req, res) => {
    const productId = req.params.productId;
    Product.findById(productId)
        .then(product => {
            if (!product){
                return res.status(404).send({error: 'Product not found'});
            }
            return res.status(200).send(product);
        })
        .catch(err =>{
        console.log('Failed to fetch product', err)
        return res.status(500).send({error: 'Failed to fetch product'});
    }) 
}

module.exports.updateProduct = async (req, res) =>{
    const productId = req.params.productId;
    const updatedProduct = {
        name : req.body.name,
        description : req.body.description,
        price : req.body.price
    }

    return Product.findByIdAndUpdate(productId, updatedProduct)
    .then(updatedProduct => {
        if (!updatedProduct){
            return res.status(404).send({error: 'Product not found'});
        }else {
            return res.status(200).send({message: 'Product updated successfully', updatedProduct: updatedProduct})
        }
    }).catch(err =>{
        console.log('Error in updating a product:', err)
        return res.status(500).send({error: 'Error updating a product'});
})
}

module.exports.archiveProduct = (req, res) =>{
 let updateActiveField  = {
    isActive : false
 }

 if (req.user.isAdmin == true){
    return Product.findByIdAndUpdate(req.params.productId, updateActiveField)
    .then(product => {
        if (product) {
            return res.status(200).send({archiveProduct: product, message:'Product archived successfully'});
        } else {
            return res.status(400).send({error: 'Product not found'});
        }
    })
     .catch(err => {
        console.error("Error archiving product: ", err);
            return res.status(500).send({ error: 'Failed to archive product' });
        })
}
else{
    return res.status(403).send({error: 'You do not have rights to do this'});
    }
}

module.exports.activateProduct = (req, res) => {

    let updateActiveField   = {
        isActive: true
    }
    if(req.user.isAdmin == true ){
        return Product.findByIdAndUpdate(req.params.productId, updateActiveField)
        .then(product => {
            if (product) {
                return res.status(200).send({message: 'Product activated successfully'})
            } else {
                return res.status(404).send({error: 'Product not found'})         
        }   
    })
    .catch(err => { return res.status(500).send(err)});
    }
    else{
        return res.status(403).send({error: 'You do not have rights to do this'});
    }
}

module.exports.searchProductByName = async (req, res) => {
  try {
    // Get product name from request body
    const { productName } = req.body;

    // Search for products by product name
    const products = await Product.find({ name: { $regex: productName, $options: 'i' } });

    return res.status(200).json({ products });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
module.exports.searchProductByPriceRange = async (req, res) => {
  
  try {
    const { minPrice, maxPrice } = req.body;

    // Query products based on price range
    const products = await Product.find({ price: { $gte: minPrice, $lte: maxPrice } });
    return res.status(200).json({ products });
    
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}