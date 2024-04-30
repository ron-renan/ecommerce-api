const bcrypt = require('bcrypt');
const User = require ("../models/User");
const auth = require("../auth");

module.exports.registerUser = async (req, res) => {

	const checkUser = await User.findOne({email: req.body.email});

    if (checkUser){

        if (checkUser.firstName === req.body.firstName && checkUser.lastName === req.body.lastName){
            return res.status(400).json({error: 'User is already registered. Please proceed to sign in.'});    
        } else {
            return res.status(400).json({error: 'Email address already used by other user. Please use other email address.'})
        }
        
    }
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

module.exports.setAsAdmin = async (req, res) => {
	const { id } = req.params;
 try {
    

    // Check if the user making the request is an admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Find the user by id and update isAdmin status
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.isAdmin = true;
    await user.save();

    return res.status(200).json({ message: "User isAdmin status updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}


module.exports.updatePassword = async (req, res) => {
  try {
   
    const { currentPassword, newPassword } = req.body;

    const { id } = req.user; // Extracting user ID

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find the user by userId
    const userToUpdate = await User.findById(id);

     if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" });
    }
    //check current password on dbase vs password encoded

    bcrypt.compare(currentPassword, userToUpdate.password, (err, result) =>{

    	if (err){
    		return res.status(400).send({error: 'Error in find'})
    	} 
    	if (result){
    		console.log('Password match');
    		userToUpdate.password = hashedPassword;
    		userToUpdate.save();
    		res.status(200).json({message: 'Password updated Successfully', updatedUser : userToUpdate});
    	}else{
    		return res.status(200).send('Current password did not match. Try again!');
    	}
    })

    } catch (error){
		console.error(error);
		res.status(500).json({message: 'Internal server error'});
	}
}

