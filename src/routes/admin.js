import express from 'express'

import {
  getDashboardStats,
  globalSearch,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getAllSpaces,
  createSpace,
  updateSpace,
  deleteSpace,
  getAllBookings,
  updateBooking,
  deleteBooking,
  getAllLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getAllAmenities,
  createAmenity,
  updateAmenity,
  deleteAmenity,
  reorderAmenities,
} from '../controllers/adminController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// Dashboard and Global Search
router.get('/dashboard', authenticateUser, authorizeRoles('superadmin'), getDashboardStats)
router.get('/search', authenticateUser, authorizeRoles('superadmin'), globalSearch)

// Users Management
router
  .route('/users')
  .get(authenticateUser, authorizeRoles('superadmin'), getAllUsers)
  .post(authenticateUser, authorizeRoles('superadmin'), createUser)

router
  .route('/users/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateUser)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteUser)

// Spaces Management
router
  .route('/spaces')
  .get(authenticateUser, authorizeRoles('superadmin'), getAllSpaces)
  .post(authenticateUser, authorizeRoles('superadmin'), createSpace)

router
  .route('/spaces/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateSpace)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteSpace)

// Bookings Management
router.route('/bookings').get(authenticateUser, authorizeRoles('superadmin'), getAllBookings)

router
  .route('/bookings/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateBooking)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteBooking)

// Locations Management
router
  .route('/locations')
  .get(authenticateUser, authorizeRoles('superadmin'), getAllLocations)
  .post(authenticateUser, authorizeRoles('superadmin'), createLocation)

router
  .route('/locations/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateLocation)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteLocation)

// Amenities Management
router
  .route('/amenities')
  .get(getAllAmenities) // Make public like space types
  .post(authenticateUser, authorizeRoles('superadmin'), createAmenity)

router
  .route('/amenities/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateAmenity)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteAmenity)

router.patch('/amenities/reorder', authenticateUser, authorizeRoles('superadmin'), reorderAmenities)

export default router
