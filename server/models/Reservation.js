import mongoose from 'mongoose';

const ownerResponseSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['received', 'confirmed', 'declined'],
      default: 'received',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const rideSchema = new mongoose.Schema(
  {
    required: {
      type: Boolean,
      default: false,
    },
    provider: {
      type: String,
      enum: ['cab', 'uber'],
      default: 'cab',
    },
    pickupAddress: {
      type: String,
      trim: true,
      default: '',
    },
    pickupTime: Date,
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    providerName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: [
        'not-required',
        'received',
        'confirmed',
        'declined',
        'cancelled',
        'completed',
      ],
      default: 'not-required',
    },
    statusMessage: {
      type: String,
      trim: true,
      default: '',
    },
    respondedAt: Date,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isSystemGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const reservationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    place: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Place',
      required: true,
      index: true,
    },
    reservationFor: {
      type: Date,
      required: true,
      index: true,
    },
    guests: {
      type: Number,
      min: 1,
      max: 20,
      default: 1,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    accessibilitySupportNotes: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['received', 'confirmed', 'declined', 'cancelled', 'completed'],
      default: 'received',
    },
    ownerResponse: {
      type: ownerResponseSchema,
      default: () => ({
        status: 'received',
        message: '',
        respondedAt: null,
        respondedBy: null,
        isSystemGenerated: false,
      }),
    },
    ride: {
      type: rideSchema,
      default: () => ({
        required: false,
        provider: 'cab',
        pickupAddress: '',
        pickupTime: null,
        notes: '',
        providerName: '',
        status: 'not-required',
        statusMessage: '',
        respondedAt: null,
        respondedBy: null,
        isSystemGenerated: false,
      }),
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Reservation', reservationSchema);
