const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const User = require('../models/User');
const Otp = require('../models/Otp');
const router = express.Router();

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Generate 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

// Send OTP email using SendGrid
const sendOtpEmail = async (email, otp) => {
  try {
    console.log(`Attempting to send OTP to ${email}`);
    const msg = {
      to: email,
      from: 'uselessacc2k25@gmail.com', // Must match verified SendGrid sender
      subject: 'Your OTP for Voting System',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    };
    const response = await sgMail.send(msg);
    console.log(`Email sent to ${email} via SendGrid:`, response);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', {
      message: error.message,
      response: error.response ? error.response.body : null,
      stack: error.stack,
    });
    throw new Error('Failed to send OTP email');
  }
};

// Register
router.post('/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(`Register request for ${email}`);
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      console.log(`User already exists: ${email}`);
      return res.status(400).json({ msg: 'User already exists' });
    }

    // Create user but don't save yet
    user = new User({ email, password, role: 'user' });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Save OTP
    try {
      await Otp.create({ email, otp, expiresAt });
      console.log(`OTP created for ${email}: ${otp}`);
    } catch (error) {
      console.error('Error saving OTP:', error);
      throw new Error('Failed to save OTP');
    }

    // Send OTP email
    await sendOtpEmail(email, otp);

    // Save user only after OTP is sent
    await user.save();
    console.log(`User registered: ${email}`);

    res.json({ msg: 'OTP sent to email', email });
  } catch (error) {
    console.error('Registration error:', {
      message: error.message,
      stack: error.stack,
    });
    // Roll back user if created but OTP failed
    if (user && user._id) {
      await User.deleteOne({ _id: user._id });
      console.log(`Rolled back user: ${email}`);
    }
    res.status(500).json({ msg: error.message || 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    console.log(`Login request for ${email}`);
    // Check for admin credentials
    if (email === 'raj@123' && password === 'raj@123') {
      const otp = generateOtp();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
      await Otp.create({ email, otp, expiresAt });
      console.log(`Admin OTP created for ${email}: ${otp}`);
      await sendOtpEmail(email, otp);
      console.log(`Admin OTP sent to ${email}`);
      return res.json({ msg: 'OTP sent to email', email });
    }

    // Regular user login
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Invalid password for ${email}`);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    // Generate and send OTP
    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
    await Otp.create({ email, otp, expiresAt });
    console.log(`User OTP created for ${email}: ${otp}`);
    await sendOtpEmail(email, otp);
    console.log(`User OTP sent to ${email}`);

    res.json({ msg: 'OTP sent to email', email });
  } catch (error) {
    console.error('Login error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ msg: error.message || 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  try {
    console.log(`Verifying OTP for ${email}: ${otp}`);
    const otpRecord = await Otp.findOne({ email, otp });
    if (!otpRecord) {
      console.log(`Invalid or expired OTP for ${email}`);
      return res.status(400).json({ msg: 'Invalid or expired OTP' });
    }

    // OTP is valid, delete it
    await Otp.deleteOne({ _id: otpRecord._id });
    console.log(`OTP verified and deleted for ${email}`);

    // For admin
    if (email === 'raj@123') {
      const payload = { user: { id: 'admin-id', role: 'admin' } };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
      console.log(`Admin token generated for ${email}`);
      return res.json({ token });
    }

    // For regular user
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found after OTP verification: ${email}`);
      return res.status(400).json({ msg: 'User not found' });
    }

    const payload = { user: { id: user.id, role: user.role } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(`User token generated for ${email}`);
    res.json({ token });
  } catch (error) {
    console.error('OTP verification error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;