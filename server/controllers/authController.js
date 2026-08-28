import User from '../models/User.js';
import { normalizeAccessibilityProfile } from '../utils/accessibility.js';
import { sanitizeUser, signToken } from '../utils/auth.js';
import {
  createPasswordResetCode,
  hashPasswordResetCode,
  sendPasswordResetEmail,
} from '../utils/passwordReset.js';

export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const accessibilityProfile = normalizeAccessibilityProfile(req.body.accessibilityProfile);

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({
      name,
      email,
      password,
      // Privileged accounts are created through an administrative process, never public signup.
      role: 'user',
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

export const forgotPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const genericMessage =
      'If an account exists for that email address, a six-digit verification code has been sent.';

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const user = await User.findOne({ email }).select(
      '+passwordResetCodeHash +passwordResetExpires'
    );

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const passwordReset = createPasswordResetCode();
    user.passwordResetCodeHash = passwordReset.codeHash;
    user.passwordResetExpires = passwordReset.expiresAt;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail({
        recipient: user.email,
        code: passwordReset.code,
      });

      return res.json({
        message: genericMessage,
      });
    } catch (error) {
      user.passwordResetCodeHash = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });
      throw error;
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    const errorMessage = error instanceof Error ? error.message : '';
    const emailIsNotConfigured =
      errorMessage ===
      'Password reset email is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.';

    return res.status(500).json({
      message: emailIsNotConfigured
        ? 'Password reset email is not configured. Add GMAIL_USER and GMAIL_APP_PASSWORD to server/.env, then restart the server.'
        : 'We could not send the verification code. Check the Gmail address and app password, then try again.',
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const code = String(req.body.code || '').trim();
    const password = String(req.body.password || '');

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ message: 'Email and a valid six-digit code are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const user = await User.findOne({
      email,
      passwordResetCodeHash: hashPasswordResetCode(code),
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordResetCodeHash +passwordResetExpires');

    if (!user) {
      return res.status(400).json({
        message: 'This verification code is invalid or has expired. Request a new one.',
      });
    }

    user.password = password;
    user.passwordResetCodeHash = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return res.json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Password reset could not be completed.' });
  }
};
