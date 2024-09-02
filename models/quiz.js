const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  questions: [
    {
      _id: false,
      question: String,
      answer: String,
      options: [String],
    }
  ]
}, {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
