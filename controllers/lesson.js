const path = require('node:path');
const Course = require("../models/course");
const Lesson = require("../models/lesson");
const Quiz = require("../models/quiz");
const Student = require("../models/student");

exports.createLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    // const quiz = new Quiz({ questions: req.body.quiz });
    // await quiz.save();

    // req.body.quiz = quiz.id;

    const { title, description, semester } = req.body;
    const thumbnail = req.files.thumbnail?.[0];
    const videoUrl = req.files.videoUrl?.[0];
    const videoUrlShort = req.files.videoUrlShort?.[0];

    if (!title || !description || !thumbnail || !videoUrl || !videoUrlShort) {
      return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
    }

    const lesson = new Lesson({ title, description });
    if (semester) lesson.semester = semester;
    lesson.thumbnail = thumbnail.path.replaceAll(path.sep, path.posix.sep);
    lesson.videoUrl = videoUrl.path.replaceAll(path.sep, path.posix.sep);
    lesson.videoUrlShort = videoUrlShort.path.replaceAll(path.sep, path.posix.sep);
    await lesson.save();

    course.lessons.push(lesson.id);
    await course.save();

    return res.status(200).json({ status: "success", body: { lesson } });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find();

    res.status(200).json({ status: "success", body: { lessons }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate('quiz');

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { lesson } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getUserLesson = async (req, res) => {
  const { user } = res.locals;

  try {
    const course = await Course.findOne({lessons: { $in: [req.params.id]}})
    let lesson;
    if (user.coursesPurchased.includes(course.id)) {
      //  course = await Course.findById(req.params.id).populate([{ path: 'lessons', select: '+videoUrl' }]);
       lesson = await Lesson.findById(req.params.id).populate('quiz').select('+videoUrl');
    } else {
      // course = await Course.findById(req.params.id).populate('lessons');
      lesson = await Lesson.findById(req.params.id).populate('quiz');
    }
    
    // const lesson = await Lesson.findById(req.params.id).populate('quiz');

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { lesson } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    if (req.files.thumbnail?.[0]) {
      fs.existsSync(lesson.thumbnail) && fs.unlinkSync(lesson.thumbnail);
      lesson.thumbnail = req.files.thumbnail?.[0].path.replaceAll(path.sep, path.posix.sep);
    }

    if (req.files.videoUrl?.[0]) {
      fs.existsSync(lesson.videoUrl) && fs.unlinkSync(lesson.videoUrl);
      lesson.videoUrl = req.files.videoUrl?.[0].path.replaceAll(path.sep, path.posix.sep);
    }

    if (req.files.videoUrlShort?.[0]) {
      fs.existsSync(lesson.videoUrlShort) && fs.unlinkSync(lesson.videoUrlShort);
      lesson.videoUrlShort = req.files.videoUrlShort?.[0].path.replaceAll(path.sep, path.posix.sep);
    }

    lesson.title = req.body.title ? req.body.title : lesson.title;
    lesson.description = req.body.description ? req.body.description : lesson.description;
    // lesson.thumbnail = req.body.thumbnail ? req.body.thumbnail : lesson.thumbnail;
    // lesson.videoUrl = req.body.videoUrl ? req.body.videoUrl : lesson.videoUrl;
    // lesson.videoUrlShort = req.body.videoUrlShort ? req.body.videoUrlShort : lesson.videoUrlShort;

    await lesson.save();
    return res.status(200).json({ status: "success", body: { lesson } });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.deleteLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.body.courseId);

    if (!course) {
      return res.status(404).json({ status: "fail", message: "Course does not exist!" });
    }

    const lesson = await Lesson.findById(req.params.id);

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    await Quiz.findOneAndDelete(lesson.quiz);
    await lesson.deleteOne();

    course.lessons = course.lessons.filter((el) => el.toString() !== lesson.id);

    await course.save();
    return res.status(200).json({ status: "success", message: "Lesson removed" });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.createLessonActivity = async (req, res) => {
  const { videoTimestamp, studentId } = req.body;
  const lessonId = req.params.id;

  if (!videoTimestamp) {
    return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
  }

  const student = await Student.findById(studentId);

  if (!student) {
    return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
  }

  try {
    if (!student.lessonsCompleted.some((el) => el.lessonId.toString() === lessonId)) {
      student.lessonsCompleted.push({
        lessonId,
        videoTimestamp,
        submitDate: new Date(),
      })

      await student.save();
    }

    return res.status(200).json({ status: 'success', message: 'Lesson activity created successfully' });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

/* exports.getNonApprovedLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({ isApproved: false }).setOptions({ getNonApprovedLessons: true });

    res.status(200).json({ status: "success", body: { lessons }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
}
 */
/* exports.approveLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).setOptions({ getNonApprovedLessons: true });

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    lesson.isApproved = true;

    await lesson.save();
    return res.status(200).json({ status: "success", body: { lesson } });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
}
 */