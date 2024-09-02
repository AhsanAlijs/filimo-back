const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    grade: String,
    assignmentSubmitted: [{
      _id: false,
      assignment: String,
      submitDate: Date,
      assignmentId: {
        type: mongoose.Types.ObjectId,
        ref: 'Assignment',
      }
    }],
    examSubmitted: [{
      _id: false,
      examFile: String,
      submitDate: Date,
      examId: {
        type: mongoose.Types.ObjectId,
        ref: 'Exam',
      }
    }],
    lessonsCompleted: [{
      _id: false,
      videoTimestamp: String,
      submitDate: Date,
      lessonId: {
        type: mongoose.Types.ObjectId,
        ref: 'Lesson',
      }
    }],
    quizCompleted: [{
      _id: false,
      submitDate: Date,
      quizId: {
        type: mongoose.Types.ObjectId,
        ref: 'Quiz',
      }
    }],
  },
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Student", studentSchema);
