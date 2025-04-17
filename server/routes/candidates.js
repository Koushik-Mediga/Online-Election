const express = require('express');
const router = express.Router();
const Candidate = require('../models/Candidate');
const Vote = require('../models/Vote');
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

// Get all candidates
router.get('/', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// Add a candidate (admin only)
router.post('/', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const candidate = new Candidate({ name });
    await candidate.save();
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ msg: 'Error adding candidate' });
  }
});

// Update a candidate (admin only)
router.put('/:id', verifyAdmin, async (req, res) => {
  const { name } = req.body;
  try {
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!candidate) return res.status(404).json({ msg: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(400).json({ msg: 'Error updating candidate' });
  }
});

// Delete a candidate (admin only)
router.delete('/:id', verifyAdmin, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) return res.status(404).json({ msg: 'Candidate not found' });
    await Vote.deleteMany({ candidateId: req.params.id }); // Remove associated votes
    res.json({ msg: 'Candidate deleted' });
  } catch (error) {
    res.status(400).json({ msg: 'Error deleting candidate' });
  }
});

module.exports = router;