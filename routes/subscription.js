const express = require('express');

const router = express.Router();
const subscriptionController = require('../controllers/subscription');
const authController = require('../controllers/auth');

router.get('/', authController.protect, authController.restrictTo('admin'), subscriptionController.getAllSubscriptions);
router.post('/create-payment', authController.protect, authController.restrictTo('parent'), subscriptionController.createPayment);
router.post('/webhook-callback', subscriptionController.webhookCallback);

module.exports = router;