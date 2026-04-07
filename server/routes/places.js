import express from 'express';
import auth from '../middleware/auth.js';
import {
  addReview,
  addAlert,
  createPlace,
  deletePlace,
  getPlaceById,
  getPlaces,
  resolveAlert,
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
router.post('/:id/alerts', auth, addAlert);
router.patch('/:id/alerts/:alertId/resolve', auth, resolveAlert);

export default router;
