const fs = require('node:fs');
const Assignment = require("../models/assignment");
const Student = require('../models/student');

exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, course } = req.body;

    if (!title, !description, !dueDate, !course) {
      return res.status(400).json({ status: 'fail', message: 'Invalid details' });
    }

    const assignmentFilePath = req.file ? req.file.path : null;

    if (!assignmentFilePath) {
      return res.status(400).json({ error: "File upload failed" });
    }

    const assignment = new Assignment({
      title,
      description,
      teacher: res.locals.user.id,
      course,
      dueDate,
      assignment: assignmentFilePath,
    });

    await assignment.save();

    return res.status(201).json({ message: "Assignment created successfully by the teacher.", data: { assignment } });
  } catch (err) {
    console.error("Error posting assignment by the teacher:", err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllAssignment = async (req, res) => {
  try {
    const assignments = await Assignment.find();

    res.status(200).json({ status: "success", body: { assignments }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllAssignmentsForCourse = async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.id });

    res.status(200).json({ status: "success", body: { assignments }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAllAssignmentsByTeacher = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacher: req.params.id });

    res.status(200).json({ status: "success", body: { assignments }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.getAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ status: "fail", message: "Assignment does not exist!" });
    }

    return res.status(200).json({ status: "success", body: { assignment } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.updateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ status: "fail", message: "Assignment does not exist!" });
    }

    if (req.file) {
      fs.existsSync(assignment.assignment) && fs.unlinkSync(assignment.assignment);
      assignment.assignment = req.file.path.replaceAll(path.sep, path.posix.sep);
    }

    assignment.title = req.body.title ? req.body.title : assignment.title;
    assignment.description = req.body.description ? req.body.description : assignment.description;
    assignment.dueDate = req.body.dueDate ? req.body.dueDate : assignment.dueDate;
    assignment.teacher = req.body.teacher ? req.body.teacher : assignment.teacher;
    assignment.course = req.body.course ? req.body.course : assignment.course;
    assignment.isActive = req.body.isActive ? req.body.isActive : assignment.isActive;

    await assignment.save();
    return res.status(200).json({ status: "success", body: { assignment } });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ status: "fail", message: "Assignment does not exist!" });
    }

    fs.existsSync(assignment.assignment) && fs.unlinkSync(assignment.assignment);

    await assignment.deleteOne();

    return res.status(200).json({ status: "success", message: "Assignment deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
};

exports.submitAssignment = async (req, res) => {
  const { studentId } = req.body;

  if (!req.file) {
    return res.status(400).json({ status: "fail", message: "You must provide an assignment file" });
  }

  const student = await Student.findById(studentId);

  if (student.assignmentSubmitted.some(el => el?.assignmentId?.toString() === req.params.id)) {
    fs.existsSync(req.file.path) && fs.unlinkSync(req.file.path);
    return res.status(400).json({ status: "fail", message: "Assignment already submitted!" });
  }

  try {
    const assignment = await Assignment.findById(req.params.id);

    if (!assignment) {
      return res.status(404).json({ status: "fail", message: "Assignment does not exist!" });
    }

    student.assignmentSubmitted.push({
      assignmentId: req.params.id,
      assignment: req.file.path,
      submitDate: new Date(),
    })

    await student.save();

    return res.status(200).json({ status: "success", message: "Assignment submitted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
    
  }
}