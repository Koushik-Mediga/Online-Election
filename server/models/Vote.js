const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true }, // One vote per user
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
});

module.exports = mongoose.model('Vote', voteSchema);