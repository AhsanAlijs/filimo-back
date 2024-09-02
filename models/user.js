const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    role: {
      type: String,
      enum: ['admin', 'teacher', 'parent'],
    },
    child: [{
      type: mongoose.Types.ObjectId,
      ref: 'Student',
    }],
    coursesPurchased: [{
      type: mongoose.Types.ObjectId,
      ref: 'Course',
    }],
    accessTokens: [String],
  },
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);
module.exports = mongoose.model("User", userSchema);
