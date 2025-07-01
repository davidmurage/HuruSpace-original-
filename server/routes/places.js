import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import Place from '../models/Place.js';
import auth from '../middleware/auth.js';

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'your-cloud-name',
  api_key: process.env.CLOUDINARY_API_KEY || 'your-api-key',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'your-api-secret'
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'huruspaces',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 800, height: 600, crop: 'limit' }]
  }
});

const upload = multer({ storage: storage });

// Get all places
router.get('/', async (req, res) => {
  try {
    const places = await Place.find().populate('createdBy', 'name email');
    res.json(places);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get place by ID
router.get('/:id', async (req, res) => {
  try {
    const place = await Place.findById(req.params.id).populate('createdBy', 'name email');
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }
    res.json(place);
  } catch (error) {
    console.error('Error fetching place:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new place (admin only)
router.post('/', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      description,
      accessibilityFeatures,
      contact,
      location
    } = req.body;

    // Parse JSON strings
    const parsedFeatures = JSON.parse(accessibilityFeatures || '[]');
    const parsedContact = JSON.parse(contact || '{}');
    const parsedLocation = JSON.parse(location || '{}');

    // Get image URLs from Cloudinary
    const imageUrls = req.files ? req.files.map(file => file.path) : [];

    const place = new Place({
      name,
      type,
      address,
      description,
      accessibilityFeatures: parsedFeatures,
      images: imageUrls,
      contact: parsedContact,
      location: parsedLocation,
      createdBy: req.userId,
      rating: Math.random() * 2 + 3 // Random rating between 3-5 for demo
    });

    await place.save();
    await place.populate('createdBy', 'name email');

    res.status(201).json(place);
  } catch (error) {
    console.error('Error creating place:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update place (admin only)
router.put('/:id', auth, upload.array('images', 5), async (req, res) => {
  try {
    const {
      name,
      type,
      address,
      description,
      accessibilityFeatures,
      contact,
      location
    } = req.body;

    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    // Parse JSON strings
    const parsedFeatures = JSON.parse(accessibilityFeatures || '[]');
    const parsedContact = JSON.parse(contact || '{}');
    const parsedLocation = JSON.parse(location || '{}');

    // Get new image URLs if uploaded
    const newImageUrls = req.files ? req.files.map(file => file.path) : [];
    const imageUrls = newImageUrls.length > 0 ? newImageUrls : place.images;

    // Update place
    const updatedPlace = await Place.findByIdAndUpdate(
      req.params.id,
      {
        name,
        type,
        address,
        description,
        accessibilityFeatures: parsedFeatures,
        images: imageUrls,
        contact: parsedContact,
        location: parsedLocation
      },
      { new: true }
    ).populate('createdBy', 'name email');

    res.json(updatedPlace);
  } catch (error) {
    console.error('Error updating place:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete place (admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const place = await Place.findById(req.params.id);
    if (!place) {
      return res.status(404).json({ message: 'Place not found' });
    }

    await Place.findByIdAndDelete(req.params.id);
    res.json({ message: 'Place deleted successfully' });
  } catch (error) {
    console.error('Error deleting place:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;