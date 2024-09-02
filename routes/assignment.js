const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const assignmentController = require('../controllers/assignment');
const multer = require('multer');
const storage = require("../utils/multer");

const upload = multer({
  storage,
});

router.use(authController.protect);

router.get('/', assignmentController.getAllAssignment);
router.get('/course/:id', assignmentController.getAllAssignmentsForCourse);
router.get('/teacher/:id', assignmentController.getAllAssignmentsByTeacher);
router.post('/submit/:id', authController.restrictTo('parent'), upload.single('assignment'), assignmentController.submitAssignment);
router.get('/:id', assignmentController.getAssignment);
router.post('/', authController.restrictTo('teacher'), upload.single('assignment'), assignmentController.createAssignment);
router.patch('/:id', authController.restrictTo('teacher'), upload.single('assignment'), assignmentController.updateAssignment);
router.delete('/:id', authController.restrictTo('teacher'), assignmentController.deleteAssignment);

module.exports = router;