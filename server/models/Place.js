import mongoose from 'mongoose';

const accessibilityCategorySchema = new mongoose.Schema(
  {
    mobility: [{ type: String }],
    visual: [{ type: String }],
    hearing: [{ type: String }],
    cognitive: [{ type: String }],
    temporary: [{ type: String }],
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    accessibilityRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      default: '',
    },
    issueFlags: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  accessibilityFeatures: [{
    type: String
  }],
  accessibilityDetails: {
    type: accessibilityCategorySchema,
    default: () => ({
      mobility: [],
      visual: [],
      hearing: [],
      cognitive: [],
      temporary: [],
    }),
  },
  images: [{
    type: String
  }],
  accessibilityScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  verificationStatus: {
    type: String,
    enum: ['community', 'verified'],
    default: 'community',
  },
  reviews: [reviewSchema],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  contact: {
    phone: String,
    email: String
  },
  location: {
    latitude: {
      type: Number,
      default: 0
    },
    longitude: {
      type: Number,
      default: 0
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.model('Place', placeSchema);
