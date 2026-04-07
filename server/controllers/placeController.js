import Place from '../models/Place.js';
import {
  calculateAverageAccessibilityRating,
  calculateAccessibilityScore,
  flattenAccessibilityDetails,
  normalizeAccessibilityDetails,
  normalizeStringArray,
  parseJsonField,
} from '../utils/accessibility.js';
import { extractUploadedImageUrls } from '../utils/upload.js';

const parsePlacePayload = (body, files = []) => {
  const accessibilityDetails = normalizeAccessibilityDetails(body.accessibilityDetails);
  const externalImageUrls = normalizeStringArray(parseJsonField(body.imageUrls, []));
  const uploadedImageUrls = extractUploadedImageUrls(files);

  return {
    name: body.name,
    type: body.type,
    address: body.address,
    description: body.description || '',
    contact: parseJsonField(body.contact, {}),
    location: parseJsonField(body.location, {}),
    verificationStatus: body.verificationStatus || 'community',
    accessibilityDetails,
    accessibilityFeatures: flattenAccessibilityDetails(accessibilityDetails),
    images: [...externalImageUrls, ...uploadedImageUrls],
  };
};

const canManagePlace = (user, place) =>
  user?.role === 'admin' || String(place.createdBy) === String(user?._id);

export const getPlaces = async (req, res) => {
  try {
    const { search, type, features, needs } = req.query;
    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const requestedFeatures = normalizeStringArray(
      typeof features === 'string' ? features.split(',') : []
    );

    if (requestedFeatures.length) {
      query.accessibilityFeatures = { $all: requestedFeatures };
    }

    const requestedNeeds = normalizeStringArray(
      typeof needs === 'string' ? needs.split(',') : []
    );

    if (requestedNeeds.length) {
      query.$and = requestedNeeds.map((need) => ({
        [`accessibilityDetails.${need}.0`]: { $exists: true },
      }));
    }

    const places = await Place.find(query)
      .populate('createdBy', 'name email')
      .populate('reviews.user', 'name')
      .sort({ createdAt: -1 });

    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlaceById = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('reviews.user', 'name');

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlace = async (req, res) => {
  try {
    const payload = parsePlacePayload(req.body, req.files);

    const place = new Place({
      ...payload,
      createdBy: req.userId,
      verificationStatus: req.user.role === 'admin' ? payload.verificationStatus : 'community',
      accessibilityScore: calculateAccessibilityScore(payload.accessibilityDetails, []),
    });

    await place.save();
    await place.populate('createdBy', 'name email');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updatePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    if (!canManagePlace(req.user, place)) {
      return res.status(403).json({ message: 'You do not have permission to update this place' });
    }

    const payload = parsePlacePayload(req.body, req.files);

    place.name = payload.name;
    place.type = payload.type;
    place.address = payload.address;
    place.description = payload.description;
    place.contact = payload.contact;
    place.location = payload.location;
    place.verificationStatus = req.user.role === 'admin' ? payload.verificationStatus : place.verificationStatus;
    place.accessibilityDetails = payload.accessibilityDetails;
    place.accessibilityFeatures = payload.accessibilityFeatures;
    place.images = payload.images.length ? payload.images : place.images;
    place.accessibilityScore = calculateAccessibilityScore(payload.accessibilityDetails, place.reviews);
    place.rating = calculateAverageAccessibilityRating(place.reviews);

    await place.save();
    await place.populate('createdBy', 'name email');
    await place.populate('reviews.user', 'name');

    res.json(place);
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deletePlace = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    if (!canManagePlace(req.user, place)) {
      return res.status(403).json({ message: 'You do not have permission to delete this place' });
    }

    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addReview = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const review = {
      user: req.userId,
      accessibilityRating: Number(req.body.accessibilityRating) || 0,
      comment: req.body.comment || '',
      issueFlags: normalizeStringArray(parseJsonField(req.body.issueFlags, [])),
    };

    place.reviews.unshift(review);
    place.accessibilityScore = calculateAccessibilityScore(
      place.accessibilityDetails,
      place.reviews
    );
    place.rating = calculateAverageAccessibilityRating(place.reviews);

    await place.save();
    await place.populate('createdBy', 'name email');
    await place.populate('reviews.user', 'name');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
