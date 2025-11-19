import express from 'express'

import { createLead, getLeads, getLead, updateLeadStatus } from '../controllers/leadController.js'
import { authenticateUser, authorizeRoles } from '../middleware/auth.js'

const router = express.Router()

// Public endpoint - create lead
router.post('/', createLead)

// Admin endpoints - require authentication and admin role
router.get('/', authenticateUser, authorizeRoles('admin', 'superadmin'), getLeads)
router.get('/:id', authenticateUser, authorizeRoles('admin', 'superadmin'), getLead)
router.patch(
  '/:id/status',
  authenticateUser,
  authorizeRoles('admin', 'superadmin'),
  updateLeadStatus
)

export default router
