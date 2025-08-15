import express from 'express'

import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  logout,
} from '../controllers/authController.js'
import { authenticateUser } from '../middleware/auth.js'

const router = express.Router()

router.post('/register', register)

router.post('/login', login)

router.post('/logout', logout)

router.get('/me', authenticateUser, getCurrentUser)

router.patch('/update-profile', authenticateUser, updateProfile)

export default router
