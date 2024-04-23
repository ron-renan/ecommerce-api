const bcrypt = require('bcrypt');
const User = require ("../models/User");
const auth = require("../auth");

module.exports.registerUser = (req, res) => {
	// Checks if the email is in the right format
   if (!req.body.email.includes("@")){
       return res.status(400).send({error: "Email Invalid"});
   }
		// Checks if the mobile number has the correct number of characters
      else if (req.body.mobileNo.length !== 11){
            return res.status(400).send({error: "Mobile number invalid"});
      }
		// Checks if the password has atleast 8 characters
        else if (req.body.password.length < 8) {
            return res.status(400).send({error: "Password must be at least 8 characters"});
            // If all needed requirements are achieved
            } else {
                let newUser = new User({
                    firstName : req.body.firstName,
                    lastName : req.body.lastName,
                    email : req.body.email,
                    mobileNo : req.body.mobileNo,
                    password : bcrypt.hashSync(req.body.password, 10)
               })

                return newUser.save()
                .then((result) => res.status(201).send({message: 'Registered Successfully'}))
                .catch(err =>{
        		console.log('Error in Save', err)
        		res.status(500).send({error: 'Error in Save'});
            	})
            }
}

module.exports.loginUser = (req, res) => {
	
	if(req.body.email.includes("@")){
		return User.findOne({ email : req.body.email}).then(result => {
		if(result == null) {
			return res.status(404).send({error: "No email found"});
		}else{
			const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
			if(isPasswordCorrect){
				
				return res.status(200).send({ access : auth.createAccessToken(result)})
			}else{
				return res.status(401).send({error: "Email and password do not match."});
			}
		}
	})
	.catch(err =>{
        		console.log('Error in find', err)
        		res.status(500).send({error: 'Error in find'});
            	})
}else{
	return res.status(400).send({error: 'Invalid in email'})
}
	
}

module.exports.getProfile = (req, res) => {
		    const userId = req.user.id;

		    User.findById(userId)
	        .then(user => {
	            if (!user) {
	                return res.status(404).send({ error: 'User not found' });
	            }

	            // Exclude sensitive information like password
	            user.password = undefined;

	            return res.status(200).send({ user });
	        })
	        .catch(err => {
	        	console.error("Error in fetching user profile", err)
	        	return res.status(500).send({ error: 'Failed to fetch user profile' })
	        });
		}

module.exports.setAsAdmin = async (req, res, next) => {
  try {
    const userId = req.params.id;
    
    // Check if the logged-in user is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Update user's isAdmin status
    await User.findByIdAndUpdate(userId, { isAdmin: true });

    res.json({ message: "User set as admin successfully" });
  } catch (error) {
    next(error);
  }
};		


module.exports.updatePassword = async (req, res) => {
  try {
    const {newPassword} = req.body;
    const {id} = req.user;

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user's password in the database
    await User.findByIdAndUpdate(id, { password: hashedPassword });

    res.status(200).json({ message: 'Password reset successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
}