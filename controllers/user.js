const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const User = require("../models/user");
const Student = require("../models/student");
const Course = require('../models/course');

/* Get logged in user details */
exports.getUserProfile = async (req, res) => {
  if (res.locals.user) {
    return res.status(200).json({ status: "success", body: { user: res.locals.user } });
  }
}

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();

    res.status(200).json({ status: "success", body: { users }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", error: err.message || "Server Error" });
  }
}

exports.getAllUsersByRole = async (req, res) => {
  const { role } = req.params
  try {
    const users = await User.find({ role });

    res.status(200).json({ status: "success", body: { users }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", error: err.message || "Server Error" });
  }
}

/* Update current user details */
exports.updateUser = async (req, res) => {
  const user = res.locals.user

  user.fullName = req.body.fullName ? req.body.fullName : user.fullName;
  user.grade = req.body.grade ? req.body.grade : user.grade;

  try {
    await user.save();
    return res.status(200).json({ status: "success", body: { user } });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ status: "fail", error: error.message || "Server Error" });
  }
}

/* Change a given user role */
exports.changeUserRole = async (req, res) => {
  const { role, userId } = req.body;

  if (!role || !userId) {
    return res.status(400).json({ status: "fail", message: "Invalid details" });
  }
  
  try {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { role } }, // Use $set to update all fields
      { new: false, runValidators: true } // Return the updated document and validate it
    );

    if (user) {
      res.status(200).json({ status: 'success', message: "Role was updated successfully" });
    } else {
      res.status(400).json({ status: 'fail', message: "Something went wrong" });
    }
  } catch (err) {
    return res.status(500).json({ status: "fail", error: err.message || "Server Error" });
  }
}

exports.getChildren = async (req, res) => {
  const { user } = res.locals;
  try {
    await user.populate('child');

    res.status(200).json({ status: 'success', body: { user } });
  } catch (error) {
    res.status(500).json({ status: "fail", error: err.message || "Server Error" });
  }
}

exports.getTeacherCourseSubscription = async (req, res) => {
  const { user } = res.locals;

  try {
    const courses = await Course.find({ teacher: user.id });
    const users = await User.find({ coursesPurchased: { $in: courses.map(c => c.id) }}).populate('child');
    // const subscriptions = await Subscription.find();
    const students = users.flatMap(user => user.child);

    res.status(200).json({ status: "success", body: { students }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
}


/* Get current user (parent) child details */
exports.getChildActivity = async (req, res) => {
  const user = res.locals.user;

  const aggregate = await User.aggregate([
    // Match the user by the provided user ID
    { $match: { _id: new mongoose.Types.ObjectId(user.id) } },

    // Lookup to populate the 'child' field
    {
      $lookup: {
        from: 'users', // The 'User' collection
        localField: 'child', // Field to match in the current collection
        foreignField: '_id', // Field to match in the 'users' collection
        as: 'childDetails' // Output array field with child details
      }
    },

    // Unwind the 'childDetails' array to handle each child individually
    { $unwind: '$childDetails' },

    // Lookup to populate the 'lessonsCompleted' field for each child
    {
      $lookup: {
        from: 'lessons', // Assuming lessons are stored in a separate collection
        localField: 'childDetails.lessonsCompleted.lessonId', // Lesson IDs in the child user
        foreignField: '_id', // Field in the lesson documents to match
        as: 'childDetails.lessonsCompletedDetails' // Output field with lesson details
      }
    },

    // Lookup to populate the 'quizCompleted' field for each child
    {
      $lookup: {
        from: 'quizzes', // Assuming quizzes are stored in a separate collection
        localField: 'childDetails.quizCompleted', // Quiz IDs in the child user
        foreignField: '_id', // Field in the quiz documents to match
        as: 'childDetails.quizCompletedDetails' // Output field with quiz details
      }
    },

    // Group back the documents to rebuild the child details array
    {
      $group: {
        _id: '$_id',
        fullName: { $first: '$fullName' },
        email: { $first: '$email' },
        role: { $first: '$role' },
        childDetails: { $push: '$childDetails' } // Rebuild the childDetails array
      }
    }
  ]);

  const aggregate2 = await Student.aggregate([
    { $match: { _id: ObjectId("66cc5e1b08e8c7ffac73f382") } },
    {
      $lookup: {
        from: 'users',
        localField: 'child',
        foreignField: '_id',
        as: 'childDetails'
      }
    },

    // Unwind the 'childDetails' array to handle each child individually
    { $unwind: '$childDetails' },

    // Lookup to populate the 'lessonsCompleted' field for each child
    {
      $lookup: {
        from: 'lessons', // Assuming lessons are stored in a separate collection
        localField: 'childDetails.lessonsCompleted.lessonId', // Lesson IDs in the child user
        foreignField: '_id', // Field in the lesson documents to match
        as: 'childDetails.lessonsCompletedDetails' // Output field with lesson details
      }
    },

    // Lookup to populate the 'quizCompleted' field for each child
    {
      $lookup: {
        from: 'quizzes', // Assuming quizzes are stored in a separate collection
        localField: 'childDetails.quizCompleted', // Quiz IDs in the child user
        foreignField: '_id', // Field in the quiz documents to match
        as: 'childDetails.quizCompletedDetails' // Output field with quiz details
      }
    },

    // Group back the documents to rebuild the child details array
    {
      $group: {
        _id: '$_id',
        fullName: { $first: '$fullName' },
        email: { $first: '$email' },
        role: { $first: '$role' },
        childDetails: { $push: '$childDetails' } // Rebuild the childDetails array
      }
    }
  ]);

  return res.status(200).json({ status: "success", body: { user: aggregate } });
}


exports.getChildScore = async (req, res) => {
  const { user } = res.locals;
  const { studentId } = req.body;

  const student = await Student.findById(studentId);

  const courses = await Course.find({ lessons: { $in: student.lessonsCompleted }})
  // student.lessonsCompleted

  const a = student.lessonsCompleted.map((lesson) => {
    const course = courses.find((c) => c.lessons.includes(lesson));
    return {
      course,
      lesson,
    }
  })
  
}