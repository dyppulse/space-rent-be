import express from 'express'

import {
  getFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  toggleFeatureFlag,
  getFeatureFlagsByCategory,
} from '../controllers/featureFlagController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// All routes require authentication and admin role
router.use(authenticateUser)
router.use(authorizeRoles('admin', 'superadmin'))

// Get all feature flags
router.get('/', getFeatureFlags)

// Get feature flags by category
router.get('/category/:category', getFeatureFlagsByCategory)

// Get a single feature flag
router.get('/:id', getFeatureFlag)

// Create a new feature flag
router.post('/', createFeatureFlag)

// Update a feature flag
router.put('/:id', updateFeatureFlag)

// Toggle a feature flag
router.patch('/:id/toggle', toggleFeatureFlag)

// Delete a feature flag
router.delete('/:id', deleteFeatureFlag)

export default router
