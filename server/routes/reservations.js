import express from 'express';
import auth from '../middleware/auth.js';
import {
  cancelReservation,
  createReservation,
  getManagedReservations,
  getMyReservations,
  getTransportReservations,
  respondToReservation,
  respondToRideRequest,
} from '../controllers/reservationController.js';

const router = express.Router();

router.get('/managed', auth, getManagedReservations);
router.get('/my', auth, getMyReservations);
router.get('/rides', auth, getTransportReservations);
router.post('/', auth, createReservation);
router.patch('/:id/respond', auth, respondToReservation);
router.patch('/:id/ride', auth, respondToRideRequest);
router.patch('/:id/cancel', auth, cancelReservation);

export default router;
