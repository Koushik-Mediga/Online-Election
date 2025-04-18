const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
  },
  pendingRegistration: {
    email: String,
    password: String,
    role: String,
  },
});

module.exports = mongoose.model('Otp', otpSchema);