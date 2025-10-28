import express from 'express'

import {
  createBooking,
  getUserBookings,
  getOwnerBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats,
} from '../controllers/bookingController.js'
import { authenticateUser } from '../middleware/auth.js'

const router = express.Router()

// Create booking - now requires authentication
router.post('/', authenticateUser, createBooking)

// Get user bookings - for regular clients
router.get('/user', authenticateUser, getUserBookings)

router.get('/owner', authenticateUser, getOwnerBookings)

router.get('/stats', authenticateUser, getBookingStats)

router.get('/:id', authenticateUser, getBooking)

router.patch('/:id/status', authenticateUser, updateBookingStatus)

export default router
