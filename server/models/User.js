import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const interactionSchema = new mongoose.Schema(
  {
    voice: { type: Boolean, default: false },
    largeText: { type: Boolean, default: false },
    highContrast: { type: Boolean, default: false },
    simplifiedUi: { type: Boolean, default: false },
  },
  { _id: false }
);

const accessibilityProfileSchema = new mongoose.Schema(
  {
    needs: [{ type: String }],
    mobilityNeeds: [{ type: String }],
    visualNeeds: [{ type: String }],
    hearingNeeds: [{ type: String }],
    cognitiveNeeds: [{ type: String }],
    temporaryNeeds: [{ type: String }],
    interaction: {
      type: interactionSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  accessibilityProfile: {
    type: accessibilityProfileSchema,
    default: () => ({
      needs: [],
      mobilityNeeds: [],
      visualNeeds: [],
      hearingNeeds: [],
      cognitiveNeeds: [],
      temporaryNeeds: [],
      interaction: {},
    }),
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
