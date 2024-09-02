const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema(
  {
    courses: [{
      type: mongoose.Types.ObjectId,
      ref: 'Course',
    }],
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    paymentId: {
      type : String,
    },
    amount: Number,
    isPaid: {
      type: Boolean,
      default: false,
    }
  },
  {
    toJSON: {
      virtuals: true,
    },
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Subscription", subscriptionSchema);
