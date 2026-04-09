import Place from '../models/Place.js';
import Reservation from '../models/Reservation.js';
import { parseJsonField } from '../utils/accessibility.js';

const OWNER_RESPONSE_STATUSES = new Set(['confirmed', 'declined']);
const RIDE_RESPONSE_STATUSES = new Set(['confirmed', 'declined', 'completed']);

const populateReservation = (query) =>
  query
    .populate('user', 'name email')
    .populate('place', 'name address type location images accessibilityScore contact createdBy')
    .populate('ownerResponse.respondedBy', 'name email role')
    .populate('ride.respondedBy', 'name email role');

const parseFutureDate = (value, fieldName) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return { error: `${fieldName} is invalid` };
  }

  if (date <= new Date()) {
    return { error: `${fieldName} must be in the future` };
  }

  return { value: date };
};

const getOwnerReceivedMessage = () =>
  'Your reservation has been received and is awaiting confirmation from the place owner.';

const getRideReceivedMessage = (provider) =>
  `Your ${provider === 'uber' ? 'Uber' : 'cab'} pickup request has been received and is awaiting transport confirmation.`;

const normalizeRidePayload = (value, reservationFor) => {
  const source = parseJsonField(value, {});
  const rideRequired = Boolean(source?.required);

  if (!rideRequired) {
    return {
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
    };
  }

  const pickupAddress = String(source?.pickupAddress || '').trim();

  if (!pickupAddress) {
    return { error: 'Pickup address is required when ride scheduling is enabled' };
  }

  const pickupTimeResult = parseFutureDate(source?.pickupTime, 'Pickup time');

  if (pickupTimeResult.error) {
    return { error: pickupTimeResult.error };
  }

  if (pickupTimeResult.value >= reservationFor) {
    return {
      error: 'Pickup time should be before the reservation time',
    };
  }

  const provider = source?.provider === 'uber' ? 'uber' : 'cab';

  return {
    required: true,
    provider,
    pickupAddress,
    pickupTime: pickupTimeResult.value,
    notes: String(source?.notes || '').trim(),
    providerName: provider === 'uber' ? 'Uber dispatch' : 'Cab dispatch',
    status: 'received',
    statusMessage: getRideReceivedMessage(provider),
    respondedAt: new Date(),
    respondedBy: null,
    isSystemGenerated: true,
  };
};

const getManagedPlaceIds = async (user) => {
  if (user?.role === 'admin') {
    return null;
  }

  const places = await Place.find({ createdBy: user?._id }).select('_id');
  return places.map((place) => place._id);
};

const canManageReservation = (user, reservation) => {
  if (!reservation?.place) {
    return false;
  }

  if (user?.role === 'admin') {
    return true;
  }

  const placeOwnerId =
    typeof reservation.place === 'string'
      ? null
      : reservation.place?.createdBy?._id || reservation.place?.createdBy;

  return String(placeOwnerId) === String(user?._id);
};

const getDefaultOwnerMessage = (status, placeName) => {
  if (status === 'declined') {
    return `Your reservation for ${placeName} could not be confirmed.`;
  }

  return `Your reservation for ${placeName} has been confirmed.`;
};

const getDefaultRideMessage = (status, providerLabel) => {
  if (status === 'declined') {
    return `${providerLabel} could not confirm this pickup request.`;
  }

  if (status === 'completed') {
    return `${providerLabel} marked this ride as completed.`;
  }

  return `${providerLabel} confirmed this pickup request.`;
};

export const createReservation = async (req, res) => {
  try {
    const reservationForResult = parseFutureDate(
      req.body.reservationFor,
      'Reservation time'
    );

    if (reservationForResult.error) {
      return res.status(400).json({ message: reservationForResult.error });
    }

    const place = await Place.findById(req.body.placeId);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const ride = normalizeRidePayload(req.body.ride, reservationForResult.value);

    if ('error' in ride) {
      return res.status(400).json({ message: ride.error });
    }

    const reservation = new Reservation({
      user: req.userId,
      place: place._id,
      reservationFor: reservationForResult.value,
      guests: Math.min(20, Math.max(1, Number(req.body.guests) || 1)),
      notes: String(req.body.notes || '').trim(),
      accessibilitySupportNotes: String(
        req.body.accessibilitySupportNotes || ''
      ).trim(),
      status: 'received',
      ownerResponse: {
        status: 'received',
        message: getOwnerReceivedMessage(),
        respondedAt: new Date(),
        respondedBy: null,
        isSystemGenerated: true,
      },
      ride,
    });

    await reservation.save();

    const populatedReservation = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.status(201).json(populatedReservation);
  } catch (error) {
    console.error('Error creating reservation:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMyReservations = async (req, res) => {
  try {
    const reservations = await populateReservation(
      Reservation.find({ user: req.userId })
    ).sort({ reservationFor: 1, createdAt: -1 });

    return res.json(reservations);
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getManagedReservations = async (req, res) => {
  try {
    const managedPlaceIds = await getManagedPlaceIds(req.user);

    if (Array.isArray(managedPlaceIds) && managedPlaceIds.length === 0) {
      return res.json([]);
    }

    const reservations = await populateReservation(
      Reservation.find(
        managedPlaceIds ? { place: { $in: managedPlaceIds } } : {}
      )
    ).sort({ reservationFor: 1, createdAt: -1 });

    return res.json(reservations);
  } catch (error) {
    console.error('Error fetching managed reservations:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const respondToReservation = async (req, res) => {
  try {
    const status = String(req.body.status || '').trim();

    if (!OWNER_RESPONSE_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'Reservation responses must be confirmed or declined.',
      });
    }

    const reservation = await Reservation.findById(req.params.id).populate(
      'place',
      'name createdBy'
    );

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!canManageReservation(req.user, reservation)) {
      return res.status(403).json({
        message: 'You do not have permission to respond to this reservation.',
      });
    }

    if (['cancelled', 'completed'].includes(reservation.status)) {
      return res.status(400).json({
        message: 'This reservation can no longer be updated.',
      });
    }

    const message =
      String(req.body.message || '').trim() ||
      getDefaultOwnerMessage(status, reservation.place?.name || 'this place');

    reservation.status = status;
    reservation.ownerResponse = {
      status,
      message,
      respondedAt: new Date(),
      respondedBy: req.userId,
      isSystemGenerated: false,
    };

    if (status === 'declined' && reservation.ride?.required) {
      reservation.ride.status = 'declined';
      reservation.ride.statusMessage =
        'Ride request was declined because the place reservation was not confirmed.';
      reservation.ride.respondedAt = new Date();
      reservation.ride.respondedBy = req.userId;
      reservation.ride.isSystemGenerated = false;
    }

    await reservation.save();

    const populatedReservation = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.json(populatedReservation);
  } catch (error) {
    console.error('Error responding to reservation:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getTransportReservations = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can manage ride requests at the moment.',
      });
    }

    const reservations = await populateReservation(
      Reservation.find({
        'ride.required': true,
        status: { $in: ['received', 'confirmed'] },
      })
    ).sort({ 'ride.pickupTime': 1, reservationFor: 1 });

    return res.json(reservations);
  } catch (error) {
    console.error('Error fetching ride requests:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const respondToRideRequest = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can respond to ride requests right now.',
      });
    }

    const status = String(req.body.status || '').trim();

    if (!RIDE_RESPONSE_STATUSES.has(status)) {
      return res.status(400).json({
        message: 'Ride responses must be confirmed, declined, or completed.',
      });
    }

    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (!reservation.ride?.required) {
      return res.status(400).json({ message: 'This reservation has no ride request.' });
    }

    if (['cancelled', 'declined'].includes(reservation.status)) {
      return res.status(400).json({
        message: 'The reservation is no longer active for transport confirmation.',
      });
    }

    const providerName =
      String(req.body.providerName || '').trim() ||
      reservation.ride.providerName ||
      (reservation.ride.provider === 'uber' ? 'Uber dispatch' : 'Cab dispatch');
    const message =
      String(req.body.message || '').trim() ||
      getDefaultRideMessage(status, providerName);

    reservation.ride.status = status;
    reservation.ride.providerName = providerName;
    reservation.ride.statusMessage = message;
    reservation.ride.respondedAt = new Date();
    reservation.ride.respondedBy = req.userId;
    reservation.ride.isSystemGenerated = false;

    await reservation.save();

    const populatedReservation = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.json(populatedReservation);
  } catch (error) {
    console.error('Error responding to ride request:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findOne({
      _id: req.params.id,
      user: req.userId,
    });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation is already cancelled' });
    }

    reservation.status = 'cancelled';

    if (reservation.ride?.required) {
      reservation.ride.status = 'cancelled';
      reservation.ride.statusMessage =
        'Ride request was cancelled because the reservation was cancelled.';
      reservation.ride.respondedAt = new Date();
      reservation.ride.respondedBy = req.userId;
      reservation.ride.isSystemGenerated = false;
    }

    await reservation.save();

    const populatedReservation = await populateReservation(
      Reservation.findById(reservation._id)
    );

    return res.json(populatedReservation);
  } catch (error) {
    console.error('Error cancelling reservation:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
