const twilio = require("twilio");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Student = require("../models/student");
const User = require("../models/user");

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_SERVICE_SID = process.env.TWILIO_SERVICE_SID;

const twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/* Register a new user */
exports.signup = async (req, res) => {
  const { fullName, password, phoneNumber, role, grade } = req.body;

  if (!password || !phoneNumber || !fullName || !role || !['teacher', 'parent'].includes(role)) {
    return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    let student;
    if (role === 'parent') {
      student = new Student({ fullName, grade });
      await student.save();
    }

    const user = new User({ fullName, phoneNumber, role, password: hashedPassword });

    if (role === 'parent') {
      user.child = [student.id]
    }

    await user.save();

    user.password = undefined;

    res.status(200).json({ status: 'success', message: 'User registered successfully', body: { user } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

/* Create and send a JWT token */
exports.signin = async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    const user = await User.findOne({ phoneNumber }).select('+password');

    if (!user) return res.status(400).json({
      status: 'fail',
      message: 'Invalid credentials',
    });
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).send({
        status: 'fail',
        message: 'Invalid credentials',
      });
    }

    // If user has 2 or more tokens, check and remove any expired tokens
    if (user.accessTokens?.length >= 2) {
      user.accessTokens = user.accessTokens.map(token => {
        try {
          jwt.verify(token, process.env.JWT_SECRET);
          return token;
        } catch (err) {
          return null
        }
      }).filter(Boolean);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    // If user now has less than 2 tokens, issue a new token 
    if (user.accessTokens?.length < 2) {
      user.accessTokens.push(token);
    } else {
      user.accessTokens = user.accessTokens.slice(1)
      user.accessTokens.push(token);
    }

    await user.save();
    return res.status(200).json({ status: 'success', body: { token } });
  } catch (err) {
    res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

exports.signout = async (req, res) => {
  const token = req.get('Authorization')?.startsWith('Bearer') ? req.get('Authorization').split(' ')[1] : '';

  if (!token) {
    return res.status(200).json({
      status: 'success',
      message: 'You are logged out.'
    })
  }

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodeToken.id);

    user.accessTokens = user.accessTokens.filter(aToken => aToken !== token);
    await user.save();

    return res.status(200).json({
      status: 'success',
      message: 'You are logged out.'
    })
  } catch {
    console.error(err)
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(res.locals.user.id).select('password');

    const isMatch = await bcrypt.compare(req.body.oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid credentials',
      });
    }

    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    user.password = undefined;

    return res.status(200).json({
      status: 'success',
      message: "Your password is successfully updated"
    })
  } catch(err) {
    console.error(err)
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

/* Register a new student for parent */
exports.registerStudent = async (req, res) => {
  const parent = res.locals.user;
  const { fullName, grade } = req.body;

  if (!fullName || !grade) {
    return res.status(400).json({ status: 'fail', message: "Invalid Details!" });
  }

  try {
    const student = new Student({ fullName, grade });

    await student.save();

    parent.child.push(student.id);
    await parent.save();

    res.status(200).json({ status: 'success', message: 'Student registered successfully', body: { student } });
  } catch (err) {
    return res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
}

exports.forgotPassword = async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ status: 'fail', message: "Please provide an email" });
  }

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // if (process.env.NODE_ENV !== 'production') console.log(resetToken);
    // else {
      const verification = await twilioClient.verify.v2
      .services(TWILIO_SERVICE_SID)
      .verifications.create({
        channel: "sms",
        to: phoneNumber,
      });

      if (verification.status === 'pending')
        res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
      else
        res.status(500).json({ status: 'fail', message: 'Something went wrong' });
    // }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { otp, newPassword, phoneNumber } = req.body;

    if (!otp || !newPassword || !phoneNumber) {
      return res.status(400).json({ status: 'fail', message: "Please provide a valid token and new password" });
    }

    const verificationCheck = await twilioClient.verify.v2
    .services(TWILIO_SERVICE_SID)
    .verificationChecks.create({
      code: otp,
      to: phoneNumber,
    });

    if (verificationCheck.status === 'approved') {
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const user = await User.findOne({ phoneNumber });
      user.password = hashedPassword;
      user.accessTokens = [];
      await user.save();
  
      res.status(200).json({ status: "success", message: "Password updated successfully" });
    } else 
      res.status(400).json({ status: 'fail', message: 'Incorrect code' })
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ status: 'fail', message: err.message || "Server Error" });
  }
};

/* Prevent unauthenticated requests */
exports.protect = async (req, res, next) => {
  const token = req.get('Authorization')?.startsWith('Bearer') ? req.get('Authorization').split(' ')[1] : '';

  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'You are not logged in.'
    })
  }

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodeToken.id);

    if (user && user.accessTokens.includes(token)) {
      res.locals.user = user;
      return next();
    } else {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid token'
      })
    }

  } catch (err) {
    res.status(400).json({
      status: 'fail',
      message: 'Invalid token',
    })
  }
}

/* Restrict the request to the given user roles */
exports.restrictTo = (...roles) => async (req, res, next) => {
  if (roles.includes(res.locals?.user.role)) {
    return next();
  }

  res.status(403).json({
    status: 'fail',
    message: `You don't have permission to access this resource.`,
  })
}

exports.checkOTP = async (req, res) => {
  const { otp, phoneNumber } = req.body;
  
  try {
    const verificationCheck = await twilioClient.verify.v2
    .services(TWILIO_SERVICE_SID)
    .verificationChecks.create({
      code: otp,
      to: phoneNumber,
    });

  if (verificationCheck.status === 'approved')
    res.status(200).json({ status: 'success', message: 'Phone number verified' });
  else 
    res.status(400).json({ status: 'fail', message: 'Incorrect code' })
  } catch (err) {
    console.log(err.message);
    return res.status(500).json({ status: 'fail', message: err.message });
  }
}

exports.verifyPhoneNumber = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    // Check if user is already present
    const user = await User.findOne({ phoneNumber });

    if (user) {
      return res.status(401).json({
        status: 'fail',
        message: 'User is already registered',
      });
    }

    const verification = await twilioClient.verify.v2
    .services(TWILIO_SERVICE_SID)
    .verifications.create({
      channel: "sms",
      to: phoneNumber,
    });


    if (verification.status === 'pending') {
      res.status(200).json({
        status: 'success',
        message: 'OTP sent successfully',
      });
    } else {
      res.status(500).json({
        status: 'fail',
        message: 'Something went wrong',
      });
    }
  } catch (error) {
    console.log(error);
    console.log(error.message);
    return res.status(500).json({ status: 'fail', message: error.message });
  }
};
