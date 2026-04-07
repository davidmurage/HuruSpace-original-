import User from '../models/User.js';
import { normalizeAccessibilityProfile } from '../utils/accessibility.js';
import { sanitizeUser, signToken } from '../utils/auth.js';

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const accessibilityProfile = normalizeAccessibilityProfile(req.body.accessibilityProfile);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      role: role || 'user',
      accessibilityProfile,
    });

    await user.save();

    res.status(201).json({
      message: 'User created successfully',
      token: signToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    res.json({
      message: 'Login successful',
      token: signToken(user._id),
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
