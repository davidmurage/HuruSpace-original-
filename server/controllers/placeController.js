import Place from '../models/Place.js';
import {
  calculateAverageAccessibilityRating,
  calculateAccessibilityScore,
  flattenAccessibilityDetails,
  normalizeAccessibilityDetails,
  normalizeStringArray,
  parseJsonField,
} from '../utils/accessibility.js';
import { geocodeAddress, resolvePlaceLocation } from '../utils/geocoding.js';
import { fetchQualifyingPlaceCandidates } from '../utils/placeSync.js';
import { extractUploadedImageUrls } from '../utils/upload.js';

const parsePlacePayload = async (body, files = [], req) => {
  const accessibilityDetails = normalizeAccessibilityDetails(body.accessibilityDetails);
  const externalImageUrls = normalizeStringArray(parseJsonField(body.imageUrls, []));
  const uploadedImageUrls = extractUploadedImageUrls(files, req);
  const location = await resolvePlaceLocation(
    body.address,
    parseJsonField(body.location, {})
  );

  return {
    name: body.name,
    type: body.type,
    address: body.address,
    description: body.description || '',
    contact: parseJsonField(body.contact, {}),
    location,
    verificationStatus: body.verificationStatus || 'community',
    accessibilityDetails,
    accessibilityFeatures: flattenAccessibilityDetails(accessibilityDetails),
    images: [...externalImageUrls, ...uploadedImageUrls],
  };
};

const canManagePlace = (user, place) =>
  user?.role === 'admin' || String(place.createdBy) === String(user?._id);

const populatePlace = (query) =>
  query
    .populate('createdBy', 'name email')
    .populate('reviews.user', 'name')
    .populate('alerts.user', 'name')
    .populate('alerts.resolvedBy', 'name');

const buildSyncDuplicateQuery = (candidate) => ({
  $or: [
    { 'source.provider': 'openstreetmap', 'source.externalId': candidate.source.externalId },
    {
      name: candidate.name,
      address: candidate.address,
    },
  ],
});

const findDuplicatePlace = (candidate) => Place.findOne(buildSyncDuplicateQuery(candidate));

const dedupeImageUrls = (values = []) => [...new Set((values || []).filter(Boolean))];

const analyzeSyncCandidate = async (candidate) => {
  const duplicate = await findDuplicatePlace(candidate);
  const incomingImages = dedupeImageUrls(candidate.images || []);
  const existingImages = dedupeImageUrls(duplicate?.images || []);
  const imagesToImport = duplicate
    ? incomingImages.filter((image) => !existingImages.includes(image))
    : incomingImages;
  const mergedImages = duplicate
    ? dedupeImageUrls([...existingImages, ...incomingImages])
    : incomingImages;
  const addedDataPoints = [];

  if (duplicate) {
    if (!duplicate.description && candidate.description) {
      addedDataPoints.push('description');
    }

    if (!duplicate.contact?.phone && candidate.contact?.phone) {
      addedDataPoints.push('phone');
    }

    if (!duplicate.contact?.email && candidate.contact?.email) {
      addedDataPoints.push('email');
    }
  }

  const action = !duplicate
    ? 'new'
    : imagesToImport.length > 0 || addedDataPoints.length > 0
      ? 'update'
      : 'skip';

  return {
    duplicate,
    action,
    incomingImages,
    existingImages,
    imagesToImport,
    mergedImages,
    addedDataPoints,
  };
};

const buildSyncPreviewItem = (candidate, analysis) => ({
  externalId: candidate.source.externalId,
  name: candidate.name,
  type: candidate.type,
  address: candidate.address,
  sourceUrl: candidate.source.sourceUrl,
  accessibilityScore: candidate.accessibilityScore,
  action: analysis.action,
  incomingImageCount: analysis.incomingImages.length,
  imagesToImportCount: analysis.imagesToImport.length,
  existingImageCount: analysis.existingImages.length,
  totalImageCountAfterSync: analysis.mergedImages.length,
  previewImages:
    analysis.action === 'skip'
      ? analysis.incomingImages.slice(0, 4)
      : analysis.imagesToImport.slice(0, 4),
  addedDataPoints: analysis.addedDataPoints,
  existingPlace: analysis.duplicate
    ? {
        _id: String(analysis.duplicate._id),
        name: analysis.duplicate.name,
      }
    : null,
});

const sortPreviewItems = (items = []) => {
  const actionOrder = {
    new: 0,
    update: 1,
    skip: 2,
  };

  return [...items].sort((left, right) => {
    const leftActionOrder = actionOrder[left.action] ?? 99;
    const rightActionOrder = actionOrder[right.action] ?? 99;

    if (leftActionOrder !== rightActionOrder) {
      return leftActionOrder - rightActionOrder;
    }

    if (right.imagesToImportCount !== left.imagesToImportCount) {
      return right.imagesToImportCount - left.imagesToImportCount;
    }

    return left.name.localeCompare(right.name);
  });
};

const buildSyncPreviewResponse = ({
  syncResult,
  previewItems,
  createdCount,
  updateCount,
  skippedDuplicates,
}) => ({
  message:
    createdCount > 0 || updateCount > 0
      ? `Preview ready: ${createdCount} new place${createdCount === 1 ? '' : 's'} and ${updateCount} existing place${updateCount === 1 ? '' : 's'} can be imported or updated.`
      : 'Preview ready: no new qualifying places or photos would be imported from this search.',
  previewItems: sortPreviewItems(previewItems),
  newPlacesCount: createdCount,
  placesToUpdateCount: updateCount,
  skippedDuplicates,
  skippedMissingAccessibility: syncResult.skippedMissingAccessibility,
  skippedUnnamed: syncResult.skippedUnnamed,
  skippedUnsupported: syncResult.skippedUnsupported,
  totalResults: syncResult.totalResults,
  radiusMeters: syncResult.radiusMeters,
  searchArea: syncResult.searchArea,
  center: syncResult.center,
  requestedType: syncResult.requestedType,
});

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

    const places = await populatePlace(Place.find(query)).sort({ createdAt: -1 });

    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getPlaceById = async (req, res) => {
  try {
    const place = await populatePlace(Place.findById(req.params.id));

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const geocodePlaceAddress = async (req, res) => {
  try {
    const address = String(req.query.address || '').trim();

    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    const coordinates = await geocodeAddress(address);

    if (!coordinates) {
      return res.status(404).json({
        message:
          'We could not find map coordinates for that address. Please add the city/country or use manual coordinates.',
      });
    }

    res.json(coordinates);
  } catch (error) {
    console.error('Error geocoding address:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    res.status(500).json({ message: 'Server error' });
  }
};

export const createPlace = async (req, res) => {
  try {
    const payload = await parsePlacePayload(req.body, req.files, req);

    const place = new Place({
      ...payload,
      createdBy: req.userId,
      verificationStatus: req.user.role === 'admin' ? payload.verificationStatus : 'community',
      accessibilityScore: calculateAccessibilityScore(payload.accessibilityDetails, []),
    });

    await place.save();
    await place.populate('createdBy', 'name email');
    await place.populate('reviews.user', 'name');
    await place.populate('alerts.user', 'name');
    await place.populate('alerts.resolvedBy', 'name');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error creating place:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

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

    const payload = await parsePlacePayload(req.body, req.files, req);

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
    await place.populate('alerts.user', 'name');
    await place.populate('alerts.resolvedBy', 'name');

    res.json(place);
  } catch (error) {
    console.error('Error updating place:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

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
    await place.populate('alerts.user', 'name');
    await place.populate('alerts.resolvedBy', 'name');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error adding review:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const addAlert = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    const alert = {
      user: req.userId,
      alertType: req.body.alertType || 'other',
      message: req.body.message || '',
      status: 'active',
    };

    place.alerts.unshift(alert);

    await place.save();
    await place.populate('createdBy', 'name email');
    await place.populate('reviews.user', 'name');
    await place.populate('alerts.user', 'name');
    await place.populate('alerts.resolvedBy', 'name');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error adding alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resolveAlert = async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);

    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    if (!canManagePlace(req.user, place)) {
      return res.status(403).json({ message: 'You do not have permission to resolve this alert' });
    }

    const alert = place.alerts.id(req.params.alertId);

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    alert.status = 'resolved';
    alert.resolvedAt = new Date();
    alert.resolvedBy = req.userId;

    await place.save();
    await place.populate('createdBy', 'name email');
    await place.populate('reviews.user', 'name');
    await place.populate('alerts.user', 'name');
    await place.populate('alerts.resolvedBy', 'name');

    res.json(place);
  } catch (error) {
    console.error('Error resolving alert:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const syncPlacesFromInternet = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can sync qualifying places from the internet.',
      });
    }

    const syncResult = await fetchQualifyingPlaceCandidates({
      searchArea: req.body.searchArea,
      type: req.body.type,
      radiusKm: req.body.radiusKm,
    });

    const importedPlaces = [];
    const updatedPlaces = [];
    let skippedDuplicates = 0;

    for (const candidate of syncResult.candidates) {
      const analysis = await analyzeSyncCandidate(candidate);

      if (analysis.duplicate) {
        if (analysis.action === 'skip') {
          skippedDuplicates += 1;
          continue;
        }

        analysis.duplicate.images = analysis.mergedImages;

        if (!analysis.duplicate.description && candidate.description) {
          analysis.duplicate.description = candidate.description;
        }

        if (!analysis.duplicate.contact?.phone && candidate.contact?.phone) {
          analysis.duplicate.contact = {
            ...analysis.duplicate.contact,
            phone: candidate.contact.phone,
          };
        }

        if (!analysis.duplicate.contact?.email && candidate.contact?.email) {
          analysis.duplicate.contact = {
            ...analysis.duplicate.contact,
            email: candidate.contact.email,
          };
        }

        analysis.duplicate.source = {
          ...analysis.duplicate.source,
          syncedAt: new Date(),
          searchArea: syncResult.searchArea,
        };
        await analysis.duplicate.save();
        await analysis.duplicate.populate('createdBy', 'name email');
        updatedPlaces.push(analysis.duplicate);
        continue;
      }

      const place = new Place({
        ...candidate,
        createdBy: req.userId,
      });

      await place.save();
      await place.populate('createdBy', 'name email');
      importedPlaces.push(place);
    }

    return res.status(201).json({
      message:
        importedPlaces.length > 0 || updatedPlaces.length > 0
          ? `Imported ${importedPlaces.length} qualifying place${importedPlaces.length === 1 ? '' : 's'} and updated ${updatedPlaces.length} existing place${updatedPlaces.length === 1 ? '' : 's'} from the internet.`
          : 'No new qualifying places or photos were imported from the internet.',
      importedPlaces,
      updatedPlaces,
      skippedDuplicates,
      skippedMissingAccessibility: syncResult.skippedMissingAccessibility,
      skippedUnnamed: syncResult.skippedUnnamed,
      skippedUnsupported: syncResult.skippedUnsupported,
      totalResults: syncResult.totalResults,
      radiusMeters: syncResult.radiusMeters,
      searchArea: syncResult.searchArea,
      center: syncResult.center,
      requestedType: syncResult.requestedType,
    });
  } catch (error) {
    console.error('Error syncing places from internet:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};

export const previewPlacesFromInternetSync = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({
        message: 'Only admins can preview qualifying places from the internet.',
      });
    }

    const syncResult = await fetchQualifyingPlaceCandidates({
      searchArea: req.body.searchArea,
      type: req.body.type,
      radiusKm: req.body.radiusKm,
    });

    const previewItems = [];
    let newPlacesCount = 0;
    let placesToUpdateCount = 0;
    let skippedDuplicates = 0;

    for (const candidate of syncResult.candidates) {
      const analysis = await analyzeSyncCandidate(candidate);

      if (analysis.action === 'new') {
        newPlacesCount += 1;
      } else if (analysis.action === 'update') {
        placesToUpdateCount += 1;
      } else {
        skippedDuplicates += 1;
      }

      previewItems.push(buildSyncPreviewItem(candidate, analysis));
    }

    return res.json(
      buildSyncPreviewResponse({
        syncResult,
        previewItems,
        createdCount: newPlacesCount,
        updateCount: placesToUpdateCount,
        skippedDuplicates,
      })
    );
  } catch (error) {
    console.error('Error previewing places from internet sync:', error);
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }

    return res.status(500).json({ message: 'Server error' });
  }
};
