import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'huruspaces-dev-secret';

export const signToken = (userId) =>
  jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

export const verifyToken = (token) => jwt.verify(token, JWT_SECRET);

export const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  accessibilityProfile: user.accessibilityProfile,
  createdAt: user.createdAt,
});
