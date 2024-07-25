const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userID: { type: String, ref: 'User', required: true },
  date: { type: Date, required: true },
  duration: { type: Number, required: true },
  description: { type: String, required: true }
});

const Log = mongoose.model('Log', LogSchema);

module.exports = { Log };
