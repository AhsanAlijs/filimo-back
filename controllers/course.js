const path = require('node:path');
const fs = require("node:fs");
const Course = require("../models/course");
const Student = require("../models/student");

exports.createCourse = async (req, res) => {
  try {
    const { title, description, grade, category, price, teacherId } = req.body;
    const demoVideo = req.files.demoVideo?.[0];
    const image = req.files.image?.[0];

    if (!title || !description || !category || !price || !demoVideo || !image) {
      return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
    }

    const course = new Course({ title, description, category, price });

    // course.demoVideo = `${process.env.BASE_URL}/${demoVideo.path.replaceAll(path.sep, path.posix.sep)}`;
    // course.image = `${process.env.BASE_URL}/${image.path.replaceAll(path.sep, path.posix.sep)}`;

    if (category === 'class' && grade) course.grade = grade;
    if (category === 'class' && teacherId) course.teacher = teacherId;

    course.demoVideo = demoVideo.path.replaceAll(path.sep, path.posix.sep);
    course.image = image.path.replaceAll(path.sep, path.posix.sep);

    await course.save()
    return res.status(200).json({ status: 'success', message: "Course created successfully", body: { course } });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find();
    
    res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllTeacherCourses = async (req, res) => {
  const { user } = res.locals;

  try {
    const courses = await Course.find({ teacher: user.id });

    res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('lessons');

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { course } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getUserCourse = async (req, res) => {
  const { user } = res.locals;

  try {
    let course;
    if (user.coursesPurchased.includes(req.params.id)) {
       course = await Course.findById(req.params.id).populate([{ path: 'lessons', select: '+videoUrl' }]);
    } else {
      course = await Course.findById(req.params.id).populate('lessons');
    }

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { course } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllSummerCourses = async (req, res) => {
  try {
    const courses = await Course.find({ category: 'course' });

    return res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllGradeCourses = async (req, res) => {
  try {
    const courses = await Course.find({ category: 'class' });

    return res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

/* Get courses for a given class/grade */
exports.getGradeCourses = async (req, res) => {
  try {
    const courses = await Course.find({ category: 'class', grade: req.params.grade });

    return res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getStudentGradeCourses = async (req, res) => {
  const { user } = res.locals;
  const { studentId, category } = req.params;

  const student = await Student.findById(studentId);

  try {
    const courses = await Course.find({ category, grade: student.grade, _id: { $in: user.coursesPurchased } });

    return res.status(200).json({ status: "success", body: { courses } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    if (req.files.demoVideo?.[0]) {
      fs.existsSync(course.demoVideo) && fs.unlinkSync(course.demoVideo);
      course.demoVideo = req.files.demoVideo?.[0].path.replaceAll(path.sep, path.posix.sep);
    }

    if (req.files.image?.[0]) {
      fs.existsSync(course.image) && fs.unlinkSync(course.image);
      course.image = req.files.image?.[0].path.replaceAll(path.sep, path.posix.sep);
    }

    course.title = req.body.title ? req.body.title : course.title;
    course.description = req.body.description ? req.body.description : course.description;
    course.category = req.body.category ? req.body.category : course.category;
    course.grade = req.body.grade ? req.body.grade : course.grade;
    course.price = req.body.price ? req.body.price : course.price;
    // course.demoVideo = req.body.demoVideo ? req.body.demoVideo : course.demoVideo;
    // course.image = req.body.image ? req.body.image : course.image;

    await course.save();
    return res.status(200).json({ status: "success", body: { course } });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    fs.existsSync(course.demoVideo) && fs.unlinkSync(course.demoVideo);
    fs.existsSync(course.image) && fs.unlinkSync(course.image);

    await course.deleteOne();

    return res.status(200).json({ status: "success", message: "Course deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

/* Create and add lesson in the given course */
/* exports.addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(400).json({ status: "fail", message: "Course does not exist!" });
    }

    const quiz = new Quiz({ questions: req.body.quiz });
    await quiz.save();

    req.body.quiz = quiz.id;

    const lesson = new Lesson(req.body);

    await lesson.save();

    course.lessons.push(lesson.id);
    await course.save();
    return res.status(200).json({ status: "success", body: { course } });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: "fail", error: error.message || "Server Error" });
  }
};
 */
/* Remove a lesson from the given course */
/* exports.removeLesson = async (req, res) => {
  try {
    if (!req.body.lessonId) {
      return res.status(400).json({ status: "fail", message: "You must provide lessonId." });
    }

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(400).json({ status: "fail", message: "Course does not exist!" });
    }

    const lesson = await Lesson.findById(req.body.lessonId);

    if (!lesson) {
      return res.status(200).json({ status: "fail", message: "Lesson does not exist!" });
    }

    await Quiz.findOneAndDelete(lesson.quiz);
    await lesson.deleteOne();

    course.lessons = course.lessons.filter((el) => el.toString() !== req.body.lessonId);

    await course.save();
    return res.status(200).json({ status: "success", message: "Lesson removed", body: { course } });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: "fail", error: error.message || "Server Error" });
  }
};
 */