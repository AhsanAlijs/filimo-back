const express = require('express');
const multer = require('multer')
const router = express.Router();
const courseController = require('../controllers/course');
const authController = require('../controllers/auth');
const storage = require("../utils/multer");

const upload = multer({
  storage,
});

router.get('/', courseController.getAllCourses);
router.get('/summer', courseController.getAllSummerCourses);
router.get('/class', courseController.getAllGradeCourses);
router.get('/class/:grade', courseController.getGradeCourses);

router.get('/student/:studentId/:category', authController.protect, authController.restrictTo('parent'), courseController.getStudentGradeCourses);
router.get('/teacher', authController.protect, authController.restrictTo('teacher'), courseController.getAllTeacherCourses);

router.get('/:id/user', authController.protect, courseController.getUserCourse);
router.get('/:id', courseController.getCourse);

router.use(authController.protect);

router.post(
  '/',
  authController.restrictTo('admin', 'teacher'),
  upload.fields([{ name: 'demoVideo', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  courseController.createCourse
);

router.patch(
  '/:id',
  authController.restrictTo('admin', 'teacher'),
  upload.fields([{ name: 'demoVideo', maxCount: 1 }, { name: 'image', maxCount: 1 }]),
  courseController.updateCourse,
);

router.delete('/:id', authController.restrictTo('admin', 'teacher'), courseController.deleteCourse);

// router.patch('/add-lesson/:id', authController.restrictTo('admin', 'teacher'), courseController.addLesson);
// router.patch('/remove-lesson/:id', authController.restrictTo('admin', 'teacher'), courseController.removeLesson);

module.exports = router;
