import express from 'express'

import {
  createSpaceType,
  deleteSpaceType,
  getAllSpaceTypes,
  getSpaceType,
  updateSpaceType,
} from '../controllers/spaceTypeController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// Public routes
router.get('/', getAllSpaceTypes)
router.get('/:id', getSpaceType)

// Admin only routes
router.post('/', authenticateUser, authorizeRoles('superadmin'), createSpaceType)
router.patch('/:id', authenticateUser, authorizeRoles('superadmin'), updateSpaceType)
router.delete('/:id', authenticateUser, authorizeRoles('superadmin'), deleteSpaceType)

export default router
