const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  winner: { type: String, required: true },
  published: { type: Boolean, default: false },
});

module.exports = mongoose.model('Result', resultSchema);