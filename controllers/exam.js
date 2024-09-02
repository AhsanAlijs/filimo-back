const fs = require('node:fs');
const Exam = require("../models/exam");
const Student = require("../models/student");
const Course = require("../models/course");

exports.createExam = async (req, res) => {
  try {
    const { title, description, semester, course, timeDuration } = req.body;
    
    const examFilePath = req.file ? req.file.path : null;

    if (!examFilePath) {
      return res.status(400).json({ error: "File upload failed" });
    }

    if (!title, !description, !semester, !course) {
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({ status: 'fail', message: 'Invalid details' });
    }

    const exam1 = await Exam.exists({ course, semester });
    if (exam1) {
      fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
      return res.status(400).json({
        status: 'fail',
        message: 'An exam has already been created for this course semester.'
      })
    }

    const exam = new Exam({
      title,
      description,
      course,
      semester,
      timeDuration,
      examFile: examFilePath
    });

    await exam.save();

    return res.status(201).json({ message: "Exam created successfully", data: { exam } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllExam = async (req, res) => {
  try {
    const exam = await Exam.find();

    res.status(200).json({ status: "success", body: { exam }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getCourseExam = async (req, res) => {
  try {
    const exams = await Exam.find({ course: req.params.courseId });

    res.status(200).json({ status: "success", body: { exams }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getTeacherExam = async (req, res) => {
  const { user } = res.locals;
  
  try {
    const courses = await Course.find({ teacher: user.id });
    const coursesId = courses.map((course) => course.id);
    
    const exams = await Exam.find({ course: { $in: coursesId } });

    res.status(200).json({ status: "success", body: { exams }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ status: "fail", message: "Exam does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { exam } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.updateExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ status: "fail", message: "Exam does not exist!" });
    }

    if (req.file) {
      fs.existsSync(exam.examFile) && fs.unlinkSync(exam.examFile);
      exam.examFile = req.file.path.replaceAll(path.sep, path.posix.sep);
    }

    exam.title = req.body.title ? req.body.title : exam.title;
    exam.description = req.body.description ? req.body.description : exam.description;
    exam.semester = req.body.semester ? req.body.semester : exam.semester;
    exam.course = req.body.course ? req.body.course : exam.course;
    exam.timeDuration = req.body.timeDuration ? req.body.timeDuration : exam.timeDuration;

    await exam.save();
    return res.status(200).json({ status: "success", body: { assignment: exam } });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: "fail", message: error.message || "Server Error" });
  }
};

exports.deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ status: "fail", message: "Exam does not exist!" });
    }

    fs.existsSync(exam.examFile) && fs.unlinkSync(exam.examFile);

    await exam.deleteOne();

    return res.status(200).json({ status: "success", message: "Exam deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.submitExamAnswers = async (req, res) => {
  const { studentId } = req.body;

  if (!req.file) {
    return res.status(400).json({ status: "fail", message: "You must provide an answer file" });
  }

  const student = await Student.findById(studentId);

  if (!student) {
    return res.status(400).json({ status: "fail", message: "No such student exists" });
  }

  if (student.examSubmitted.some(el => el?.examId?.toString() === req.params.id)) {
    fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    return res.status(400).json({ status: "fail", message: "Exam already submitted!" });
  }

  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({ status: "fail", message: "Exam does not exist!" });
    }

    student.examSubmitted.push({
      examId: req.params.id,
      examFile: req.file.path,
      submitDate: new Date(),
    })

    await student.save();

    return res.status(200).json({ status: "success", message: "Exam submitted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
    
  }
}

exports.getSubmittedAnswersForCourse = async (req, res) => {
  const { courseId, semester } = req.params;

  try {
    const exam = await Exam.findOne({ course: courseId, semester });
    // const students = await Student.find({ "examSubmitted.examId": exam.id });
    const students = await Student.aggregate([
      {
        $lookup: {
          from: "exams", // The 'User' collection
          localField: "lessonsCompleted.lessonId", // Field to match in the current collection
          foreignField: "lessons", // Field to match in the 'users' collection
          as: "courses" // Output array field with child details
        }
      },
    ]);

    res.status(200).json({ status: "success", body: { student }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
}