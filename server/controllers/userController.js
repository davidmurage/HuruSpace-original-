import User from '../models/User.js';
import { normalizeAccessibilityProfile } from '../utils/accessibility.js';
import { sanitizeUser } from '../utils/auth.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (req.body.name) {
      user.name = req.body.name;
    }

    if (req.body.accessibilityProfile) {
      user.accessibilityProfile = normalizeAccessibilityProfile(req.body.accessibilityProfile);
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
