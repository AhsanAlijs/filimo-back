const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  dueDate: {
    type: Date,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  teacher: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  course: {
    type: mongoose.Types.ObjectId,
    ref: 'Course',
  },
  assignment: {
    type: String,
    required: true,
  },
},
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Assignment", assignmentSchema);