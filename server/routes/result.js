const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Candidate = require('../models/Candidate');
const jwt = require('jsonwebtoken');

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Admin access required' });
    }
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Publish result (admin only)
router.post('/', verifyAdmin, async (req, res) => {
  try {
    // Find candidate with most votes
    const candidates = await Candidate.find().sort({ votes: -1 }).limit(1);
    if (!candidates.length) return res.status(400).json({ msg: 'No candidates found' });

    const winner = candidates[0].name;

    // Update or create result
    let result = await Result.findOne();
    if (result) {
      result.winner = winner;
      result.published = true;
    } else {
      result = new Result({ winner, published: true });
    }
    await result.save();

    res.json({ msg: 'Result published', winner });
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Get result
router.get('/', async (req, res) => {
  try {
    const result = await Result.findOne();
    if (!result || !result.published) return res.json(null);
    res.json(result);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;