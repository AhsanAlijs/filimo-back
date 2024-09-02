const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

router.post('/signin', authController.signin);
router.post('/signup', authController.signup);
router.get('/signout', authController.signout);
router.post('/check-otp', authController.checkOTP);
router.post('/verify-phone', authController.verifyPhoneNumber);
router.patch('/update-password', authController.protect, authController.updatePassword);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password', authController.resetPassword);
router.post('/register-student', authController.protect, authController.restrictTo('parent'), authController.registerStudent);

module.exports = router;
