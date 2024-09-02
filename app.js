const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const authRouter = require('./routes/auth');
const coursesRouter = require('./routes/course');
const lessonRouter = require('./routes/lesson');
const quizRouter = require('./routes/quiz');
const usersRouter = require('./routes/user');
const assignmentsRouter = require('./routes/assignment');
const examsRouter = require('./routes/exam');
const subscriptionRouter =  require('./routes/subscription');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors('*'));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/storage', express.static(path.join(__dirname, 'storage')));

app.use('/subscriptions', subscriptionRouter)
app.use('/auth', authRouter);
app.use('/courses', coursesRouter);
app.use('/quizzes', quizRouter);
app.use('/assignments', assignmentsRouter);
app.use('/lessons', lessonRouter);
app.use('/users', usersRouter);
app.use('/exams', examsRouter);

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    status: 'fail',
    message: 'Error'
  })
});

module.exports = app;
