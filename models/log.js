const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  userID: { type: String, ref: 'User', required: true },
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, required: true }
});

const Log = mongoose.model('Log', LogSchema);

module.exports = { Log };
