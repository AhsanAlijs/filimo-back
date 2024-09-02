const mongoose = require("mongoose");

const examsSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  semester: {
    type: String,
    enum: ['first', 'second']
  },
  course: {
    type: mongoose.Types.ObjectId,
    ref: 'Course',
  },
  timeDuration: String,
  examFile: String,
},
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Exams", examsSchema);