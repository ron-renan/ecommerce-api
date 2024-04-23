const jwt = require("jsonwebtoken");
const secret = process.env.SESSION_SECRET;
// [Section] JSON Web Tokens
/*
- JSON Web Token or JWT is a way of securely passing information from the server to the client or to other parts of a server
- Information is kept secure through the use of the secret code
- Only the system that knows the secret code that can decode the encrypted information
- Imagine JWT as a gift wrapping service that secures the gift with a lock
- Only the person who knows the secret code can open the lock
- And if the wrapper has been tampered with, JWT also recognizes this and disregards the gift
- This ensures that the data is secure from the sender to the receiver
*/

module.exports.createAccessToken = (user) => {
	// const secret = process.env.SESSION_SECRET;
	const data = {
		id : user._id,
		email : user.email,
		isAdmin : user.isAdmin
	};

	return jwt.sign(data, secret, {});
};

//[SECTION] Token Verification
/*
	Analogy
	Receive the gift and open the lock to verify if the the sender is legitimate and the gift was not tampered with
	- Verify will be used as a middleware in ExpressJS. Functions added as argument in an expressJS route are considered as middleware and is able to receive the request and response objects as well as the next() function. Middlewares will be further elaborated on later sessions.
*/

module.exports.verify = (req, res, next) => {
	console.log(req.headers.authorization);

	let token = req.headers.authorization;

	if(typeof token === "undefined"){
		return res.send({auth: "Failed. No Token"});
	}else{
		console.log(token);
		token = token.slice(7, token.length);
		console.log(token);
//[SECTION] Token decryption
/*
	Analogy
	Open the gift and get the content
	- Validate the token using the "verify" method decrypting the token using the secret code.
	- token - the jwt token passed from the request headers.
	- secret - the secret word from earlier which validates our token
	- function(err,decodedToken) - err contains the error in verification, decodedToken contains the decoded data within the token after verification
*/
// "err" is a built-in variable of express to handle errors

		jwt.verify(token, secret, function(err, decodedToken){
			if(err){
				return res.send({auth: "Failed", message: err.message});
			}else{
				console.log("result from verify method:")
				console.log(decodedToken);
				req.user = decodedToken;
				next();
			}
		})
	}
}

module.exports.verifyAdmin = (req, res, next) => {
	console.log("result from verifyAdmin");
	console.log(req.user);
	if(req.user.isAdmin){
		next();
	}else{
		return res.status(403).send({auth: "Failed", message: "Action Forbidden"});
	}
}

module.exports.isLoggedIn = (req, res, next) => {
	if(req.user){
		next();
	}else{
		res.sendStatus(401);
	}
}