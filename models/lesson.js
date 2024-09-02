const mongoose = require("mongoose");

const lessonSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    thumbnail: String,
    semester: {
      type: String,
      enum: ['first', 'second'],
    },
    videoUrl: {
      type: String,
      select: false,
    },
    // isApproved: {
    //   type: Boolean,
    //   default: true,
    // },
    videoUrlShort: String,
    quiz: {
      type: mongoose.Types.ObjectId,
      ref: "Quiz",
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

// lessonSchema.pre(/find/, function filterNonApprovedLessons(next) {
//   if (this.options.getNonApprovedLessons) return next();
//   this.find({ isApproved: { $ne: false } });
//   next();
// })

module.exports = mongoose.model("Lesson", lessonSchema);
