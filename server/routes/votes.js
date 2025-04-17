const express = require('express');
const router = express.Router();
const Vote = require('../models/Vote');
const Candidate = require('../models/Candidate');
const jwt = require('jsonwebtoken');

// Middleware to verify user
const verifyUser = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Cast a vote
router.post('/', verifyUser, async (req, res) => {
  const { candidateId } = req.body;
  try {
    // Check if user has already voted
    const existingVote = await Vote.findOne({ userId: req.user.id });
    if (existingVote) return res.status(400).json({ msg: 'You have already voted' });

    // Verify candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) return res.status(404).json({ msg: 'Candidate not found' });

    // Create vote
    const vote = new Vote({ userId: req.user.id, candidateId });
    await vote.save();

    // Increment candidate's vote count
    candidate.votes += 1;
    await candidate.save();

    res.json({ msg: 'Vote cast successfully' });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get user's vote
router.get('/my-vote', verifyUser, async (req, res) => {
  try {
    const vote = await Vote.findOne({ userId: req.user.id }).populate('candidateId');
    if (!vote) return res.json(null);
    res.json(vote.candidateId);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;