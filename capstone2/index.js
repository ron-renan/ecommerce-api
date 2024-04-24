const dotenv = require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");

const session = require('express-session');

// Allows our backend application to be available to our frontend application
// Allows us to control the app's Cross Origin Resource Sharing settings
const cors = require('cors');
const userRoutes = require('./routes/user')
const productRoutes = require('./routes/product')


const app = express();
const port = 3000;

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(cors());

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false
}));

mongoose.connect("mongodb+srv://admin:admin1234@wdc028-course-booking.hdugpfx.mongodb.net/e-commerce-API?retryWrites=true&w=majority");
mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

app.use("/users",  userRoutes)
app.use("/products", productRoutes)


//"process.env.PORT || port" will use the environment variable if it is available OR will used port 4000 if none defined
//This syntax will allow flexibility when using the application locally
if(require.main === module){
	app.listen(process.env.PORT || port, () => console.log(`API is now online on port ${process.env.PORT || port}`));

}
module.exports = {app, mongoose};