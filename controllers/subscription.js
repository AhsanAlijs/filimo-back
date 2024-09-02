const mongoose = require('mongoose');
const Subscription = require("../models/subscription");
const Course = require("../models/course");
const User = require("../models/user");

exports.createPayment = async (req, res) => {
  const { user } = res.locals;
  const { coursesId } = req.body;

  if (!coursesId || !coursesId.length) {
    return res.status(500).json({ status: "fail", message: "You must provide the courses id" });
  }

  const coursesIds = coursesId.map(id => new mongoose.Types.ObjectId(id))
  const courses = await Course.find({ _id: { $in: coursesIds } }).select('price');
  const totalPrice = courses.reduce((acc, item) => (Number(acc) + Number(item.price)), 0);

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', process.env.FIB_CLIENT_ID);
  params.append('client_secret', process.env.FIB_CLIENT_SECRET);

  try {
    // Fetch the authentication token
    const authResponse = await fetch(process.env.FIB_AUTH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    if (!authResponse.ok) {
      return res.status(500).json({ status: "fail", message: 'Something went wrong' });
    }

    const authData = await authResponse.json();

    const { access_token } = authData;

    const paymentBody = {
      monetaryValue: {
        amount: totalPrice,
        currency: "IQD"
      },
      statusCallbackUrl: `${process.env.BASE_URL}/subscriptions/webhook-callback`,
    };

    // Fetch the payment creation
    const paymentResponse = await fetch(process.env.FIB_CREATE_PAYMENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`, // Set the Bearer token in the Authorization header
      },
      body: JSON.stringify(paymentBody), // Send the body as JSON
    });

    if (!paymentResponse.ok) {
      return res.status(500).json({ status: "fail", message: 'Something went wrong.' });
    }

    const paymentData = await paymentResponse.json();

    const subscription = new Subscription({
      paymentId: paymentData.paymentId,
      courses: coursesId,
      user: user.id,
      amount: totalPrice
    })

    await subscription.save();

    // Send success response
    return res.status(200).json({
      status: 'success',
      message: 'Payment created successfully',
      body: paymentData,
    });
  } catch (error) {
    console.error('Error during payment creation:', error.message || error);
    res.status(500).json({
      status: 'fail',
      message: 'Something went wrong',
    });
  }
}

exports.webhookCallback = async (req, res) => {
  const { id, status } = req.body;
  try {
    const subscription = await Subscription.findOne({ paymentId: id });
    const user = await User.findById(subscription.user);

    if (status === 'PAID') {
      subscription.isPaid = true;
      await subscription.save();

      subscription.courses.forEach(course => {
        if (!user.coursesPurchased.includes(course)) {
          user.coursesPurchased.push(course);
        }
      })

      await user.save();
    }
    res.status(202).end();
  } catch (error) {
    res.status(500).end();
  }
}

exports.getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find().populate([
      { path: 'user', select: 'phoneNumber id' },
      { path: 'courses', select: 'title id' }
    ]);

    res.status(200).json({ status: "success", body: { subscriptions }});
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: "fail", message: err.message || "Server Error" });
  }
}
