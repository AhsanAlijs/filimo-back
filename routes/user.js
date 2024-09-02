const express = require('express');
const router = express.Router();
const userController = require('../controllers/user');
const authController = require('../controllers/auth');

router.get('/profile', authController.protect, userController.getUserProfile);
router.patch('/profile', authController.protect, userController.updateUser);

router.get('/', authController.protect, authController.restrictTo('admin'), userController.getAllUsers);
router.get('/teacher/students', authController.protect, authController.restrictTo('teacher'), userController.getTeacherCourseSubscription);
router.get('/role/:role', authController.protect, authController.restrictTo('admin'), userController.getAllUsersByRole);
router.patch('/change-role', authController.protect, authController.restrictTo('admin'), userController.changeUserRole);

router.get('/child', authController.protect, authController.restrictTo('parent'), userController.getChildren);
router.get('/child-activity', authController.protect, authController.restrictTo('parent'), userController.getChildActivity);

module.exports = router;
