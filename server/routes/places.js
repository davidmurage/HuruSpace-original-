import express from 'express';
import auth from '../middleware/auth.js';
import {
  addReview,
  createPlace,
  deletePlace,
  getPlaceById,
  getPlaces,
  updatePlace,
} from '../controllers/placeController.js';
import { upload } from '../utils/upload.js';

const router = express.Router();

router.get('/', getPlaces);
router.get('/:id', getPlaceById);
router.post('/', auth, upload.array('images', 5), createPlace);
router.put('/:id', auth, upload.array('images', 5), updatePlace);
router.delete('/:id', auth, deletePlace);
router.post('/:id/reviews', auth, addReview);

export default router;
