const Lesson = require("../models/lesson");
const Quiz = require("../models/quiz");
const Student = require("../models/student");

exports.createQuiz = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.body.lessonId);

    if (!lesson) {
      return res.status(404).json({ status: "fail", message: "Lesson does not exist!" });
    }

    const previousQuiz = await Quiz.findById(lesson.quiz);

    if (previousQuiz) {
      return res.status(404).json({ status: "fail", message: "Quiz already created!" });
    }

    const quiz = new Quiz(req.body);
    await quiz.save()

    lesson.quiz = quiz.id;
    await lesson.save();

    return res.status(200).json({ status: 'success', message: "Quiz created", body: { quiz } });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
};

exports.getAllQuizes = async (req, res) => {
  try {
    const quizzes = await Quiz.find();
    
    res.status(200).json({ status: "success", body: { quizzes } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(400).json({ status: "fail", message: "Quiz does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { quiz } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(400).json({ status: "fail", message: "Quiz does not exist!" });
    }

    quiz.questions = req.body.questions;
    await quiz.save();
    return res.status(200).json({ status: "success", body: { quiz } });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(200).json({ status: "fail", message: "Quiz does not exist!" });
    }

    await quiz.deleteOne();

    return res.status(200).json({ status: "success", message: "Quiz deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.createQuizActivity = async (req, res) => {
  const { studentId } = req.body;
  const quizId = req.params.id;

  const quiz = await Quiz.findById(quizId);

  if (!quiz) {
    return res.status(404).json({ status: "fail", message: "Quiz does not exist!" });
  }

  const student = await Student.findById(studentId);

  if (!student) {
    return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
  }

  try {
    if (!student.quizCompleted.some((el) => el.quizId.toString() === quiz.id)) {
      student.quizCompleted.push({
        submitDate: new Date(),
        quizId: quiz.id
      })

      await student.save();
    }

    return res.status(200).json({ status: 'success', message: 'Quiz completed' });
  } catch (err) {
    console.log(err)
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}