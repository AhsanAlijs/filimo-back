const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const quizController = require('../controllers/quiz');

router.use(authController.protect);

router.get('/', quizController.getAllQuizes);
router.get('/:id', quizController.getQuiz);
router.post('/', authController.restrictTo('admin','teacher'), quizController.createQuiz);
router.patch('/:id', authController.restrictTo('admin', 'teacher'), quizController.updateQuiz);
router.delete('/:id', authController.restrictTo('admin', 'teacher'), quizController.deleteQuiz);

router.post('/:id/quiz-activity', authController.protect, authController.restrictTo('parent'), quizController.createQuizActivity);

module.exports = router;