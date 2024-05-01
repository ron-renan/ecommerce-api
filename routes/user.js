const express = require('express');
const userController = require('../controllers/user');
const {verify, verifyAdmin} = require ("../auth");
const router = express.Router();

router.post("/register", userController.registerUser);

router.post("/login", userController.loginUser);

router.get("/details", verify, userController.getProfile);

router.patch("/:id/setAsAdmin", verify, verifyAdmin, userController.setAsAdmin);

router.patch('/update-password', verify, userController.updatePassword);

module.exports = router;