require('dotenv').config()
const mongoose = require('mongoose');
const app = require('./app');

mongoose.connect(process.env.DB_URI);

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('MONGO: successfully connected to db');
});

app.listen(3000);
