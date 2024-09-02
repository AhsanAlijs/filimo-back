const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const examsController = require('../controllers/exam');
const multer = require('multer');
const storage = require("../utils/multer");

const upload = multer({
  storage,
});

router.get('/', examsController.getAllExam);
router.get('/course/:courseId', examsController.getCourseExam);
router.get('/teacher', authController.protect, authController.restrictTo('teacher'), examsController.getTeacherExam);

router.use(authController.protect);

router.get('/answers/:courseId/:semester', authController.restrictTo('teacher'), examsController.getSubmittedAnswersForCourse);
router.get('/:id', examsController.getExam);
router.post('/', authController.restrictTo('admin', 'teacher'), upload.single('examFile'), examsController.createExam);
router.post('/:id/submit', authController.restrictTo('parent', 'teacher'), upload.single('examFile'), examsController.submitExamAnswers);
router.patch('/:id', authController.restrictTo('admin', 'teacher'), upload.single('examFile'), examsController.updateExam);
router.delete('/:id', authController.restrictTo('admin', 'teacher'), examsController.deleteExam);

module.exports = router;