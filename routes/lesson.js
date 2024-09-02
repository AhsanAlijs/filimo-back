const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const lessonController = require('../controllers/lesson');
const multer = require('multer');
const storage = require("../utils/multer");

const upload = multer({
  storage,
});

router.get('/', lessonController.getAllLessons);
// router.get('/get-nonapproved-lessons',
//   authController.protect,
//   authController.restrictTo('admin'),
//   lessonController.getNonApprovedLessons
// )
router.get('/:id/user', authController.protect, lessonController.getUserLesson);
router.get('/:id', lessonController.getLesson);

router.post('/', 
  authController.protect,
  authController.restrictTo('admin', 'teacher'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoUrl', maxCount: 1 }, { name: 'videoUrlShort', maxCount: 1 }]),
  lessonController.createLesson,
);

// router.patch('/:id/approve-lesson', 
//   authController.protect,
//   authController.restrictTo('admin'),
//   lessonController.approveLesson
// )

router.post('/:id/lesson-activity', authController.protect, authController.restrictTo('parent'), lessonController.createLessonActivity);

router.patch('/:id', 
  authController.protect,
  authController.restrictTo('admin', 'teacher'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'videoUrl', maxCount: 1 }, { name: 'videoUrlShort', maxCount: 1 }]),
  lessonController.updateLesson
);

router.delete('/:id', authController.protect, authController.restrictTo('admin', 'teacher'), lessonController.deleteLesson);

module.exports = router;
