import express from 'express'

import {
  registerClient,
  registerOwner,
  login,
  getCurrentUser,
  updateProfile,
  logout,
  verifyEmail,
  submitUpgradeRequest,
  switchRole,
} from '../controllers/authController.js'
import { authenticateUser } from '../middleware/auth.js'

const router = express.Router()

// Registration endpoints
router.post('/register/client', registerClient)
router.post('/register/owner', registerOwner)

// Legacy register endpoint (kept for backward compatibility)
router.post('/register', registerClient)

// Email verification
router.get('/verify-email', verifyEmail)

// Login and logout
router.post('/login', login)
router.post('/logout', logout)

// User profile
router.get('/me', authenticateUser, getCurrentUser)
router.patch('/update-profile', authenticateUser, updateProfile)

// Upgrade and role management
router.post('/upgrade-request', authenticateUser, submitUpgradeRequest)
router.post('/switch-role', authenticateUser, switchRole)

export default router
