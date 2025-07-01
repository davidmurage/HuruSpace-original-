import mongoose from 'mongoose';

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['restaurant', 'office'],
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
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
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