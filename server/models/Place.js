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

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    alertType: {
      type: String,
      enum: [
        'lift-outage',
        'ramp-blocked',
        'toilet-inaccessible',
        'stairs-only',
        'audio-guidance-offline',
        'other',
      ],
      default: 'other',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
    },
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
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
  alerts: [alertSchema],
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
