const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['course', 'class']
    },
    teacher: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    demoVideo: String,
    image: String,
    grade: String,
    price: String,
    lessons: [{
      type: mongoose.Types.ObjectId,
      ref: 'Lesson',
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

module.exports = mongoose.model("Course", courseSchema);
