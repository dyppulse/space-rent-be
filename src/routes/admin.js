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
  getAllTaxonomies,
  createTaxonomy,
  updateTaxonomy,
  deleteTaxonomy,
  reorderTaxonomies,
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

// Taxonomies Management
router
  .route('/taxonomies')
  .get(authenticateUser, authorizeRoles('superadmin'), getAllTaxonomies)
  .post(authenticateUser, authorizeRoles('superadmin'), createTaxonomy)

router
  .route('/taxonomies/:id')
  .patch(authenticateUser, authorizeRoles('superadmin'), updateTaxonomy)
  .delete(authenticateUser, authorizeRoles('superadmin'), deleteTaxonomy)

router.patch(
  '/taxonomies/reorder',
  authenticateUser,
  authorizeRoles('superadmin'),
  reorderTaxonomies
)

export default router
