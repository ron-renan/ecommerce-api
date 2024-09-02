const bcrypt = require('bcrypt');
const User = require ("../models/User");
const auth = require("../auth");

module.exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, mobileNo } = req.body;

  // Check if email is in valid format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(406).json({ error: 'Invalid email' });
  }

  // Check if mobileNo is at least 11 digits
  if (mobileNo.length < 11) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(406).json({ error: 'Mobile number must be at least 11 digits' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { mobileNo }] });
    if (existingUser) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(400).json({ error: 'User with this email or mobile number already exists' });
    }

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      mobileNo,
      password: bcrypt.hashSync(req.body.password, 10)
    });
    return newUser.save()
        .then((result) => {
          res.setHeader('Cache-Control', 'no-store');
          res.status(201).send({message: 'Registered Successfully'
        });
        })
        .catch(err =>{
        console.log('Error in Save', err)
        res.setHeader('Cache-Control', 'no-store');
        return res.status(500).send({error: 'Error in Save'});
              })

    // await newUser.save();
    // return res.status(201).json.send (newUser);
  } catch (error) {
    res.setHeader('Cache-Control', 'no-store');
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


module.exports.loginUser = (req, res) => {
	
	if(req.body.email.includes("@")){
		return User.findOne({ email : req.body.email}).then(result => {
		if(result == null) {
			return res.status(404).send({error: "No email found"});
		}else{
			const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
			if(isPasswordCorrect){
				
				return res.status(200).send({ access : auth.createAccessToken(result)});
			}else{
				return res.status(401).send({error: "Email and password do not match."});
			}
		}
	})
	.catch(err =>{
        		console.log('Error in find', err);
        		return res.status(500).send({error: 'Error in find'});
            	})
}else{
	return res.status(406).send({error: 'Invalid in email'});
}
	
};

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
	        	return res.status(500).send({ error: 'Failed to fetch user profile' });
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

    // Check if the user to be made admin is already an admin
    if (user.isAdmin) {
      return res.status(400).json({ message: "User is already an admin." });
    }

    user.isAdmin = true;
    await user.save();

    return res.status(200).json({ message: "User successfully set as admin" });
  } catch (error) {
    console.error(error);
   return res.status(500).json({ message: "Internal Server Error" });
  }
};


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
    		return res.status(400).send({error: 'Error in find'});
    	} 
    	if (result){
    		console.log('Password match');
    		userToUpdate.password = hashedPassword;
    		userToUpdate.save();
    		return res.status(200).json({message: 'Password updated Successfully', updatedUser : userToUpdate});
    	}else{
    		return res.status(401).send('Current password did not match. Try again!');
    	}
    })

    } catch (error){
		console.error(error);
		return res.status(500).json({message: 'Internal server error'});
	}
}

module.exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.status(200).json(users);
  } catch (err) {
    console.error('Failed to fetch users', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Added 5/29/20224 (For Update profile)
module.exports.updateProfile = async (req, res) => {

    const { firstName, lastName, mobileNumber } = req.body;
    const userId = req.user.id; // Assuming you have middleware to extract user from JWT

  try {

    // Update user document
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { firstName, lastName, mobileNumber },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({ message: 'Failed to update profile' });
  }
};