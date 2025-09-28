import express from 'express'

import {
  processMobileMoneyPayment,
  checkPaymentStatus,
  getPaymentMethods,
  validatePhoneNumber,
} from '../controllers/paymentController.js'
import { authenticateUser } from '../middleware/auth.js'

const router = express.Router()

// Public routes (no authentication required)
router.get('/methods', getPaymentMethods)
router.post('/validate-phone', validatePhoneNumber)

// Protected routes (authentication required)
router.use(authenticateUser)

// Process mobile money payment
router.post('/mobile-money', processMobileMoneyPayment)

// Check payment status
router.get('/status/:bookingId', checkPaymentStatus)

export default router
