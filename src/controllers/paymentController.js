import { BadRequestError, NotFoundError } from '../errors/index.js'
import Booking from '../models/Booking.js'
import FeatureFlag from '../models/FeatureFlag.js'
import paymentService from '../services/paymentService.js'
import logger from '../utils/logger.js'

// Process mobile money payment
export const processMobileMoneyPayment = async (req, res, next) => {
  try {
    const { bookingId, provider, phoneNumber, amount, currency } = req.body

    // Check if mobile money payments are enabled
    const mobileMoneyFlag = await FeatureFlag.findOne({ name: 'enable_mobile_money_payments' })
    if (!mobileMoneyFlag || !mobileMoneyFlag.isEnabled) {
      throw new BadRequestError('Mobile money payments are currently disabled')
    }

    // Validate required fields
    if (!bookingId || !provider || !phoneNumber || !amount) {
      throw new BadRequestError('Missing required payment information')
    }

    // Find the booking
    const booking = await Booking.findById(bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    // Validate amount matches booking total
    if (parseFloat(amount) !== parseFloat(booking.totalPrice)) {
      throw new BadRequestError('Payment amount does not match booking total')
    }

    // Format phone number
    const formattedPhoneNumber = paymentService.formatPhoneNumber(phoneNumber)

    // Validate phone number
    if (!paymentService.isValidPhoneNumber(formattedPhoneNumber)) {
      throw new BadRequestError(
        'Invalid phone number format. Use format: 256XXXXXXXXX or 0XXXXXXXXX'
      )
    }

    // Generate payment reference
    const paymentReference = `BOOKING_${bookingId}_${Date.now()}`

    // Process payment
    const paymentData = {
      provider: provider.toUpperCase(),
      phoneNumber: formattedPhoneNumber,
      amount: parseFloat(amount),
      currency: currency || 'UGX',
      reference: paymentReference,
      description: `Payment for booking ${bookingId}`,
    }

    const paymentResult = await paymentService.processMobileMoneyPayment(paymentData)

    if (paymentResult.success) {
      // Update booking with payment information
      booking.paymentMethod = `mobile_money_${provider.toLowerCase()}`
      booking.paymentStatus = 'PENDING'
      booking.paymentReference = paymentReference
      booking.paymentTransactionId = paymentResult.transactionId
      booking.paymentProvider = provider.toUpperCase()
      await booking.save()

      logger.info('Mobile money payment initiated', {
        bookingId,
        provider,
        transactionId: paymentResult.transactionId,
        amount,
      })

      res.status(200).json({
        success: true,
        message: paymentResult.message,
        data: {
          bookingId,
          transactionId: paymentResult.transactionId,
          status: paymentResult.status,
          provider: paymentResult.provider,
          reference: paymentReference,
        },
      })
    } else {
      logger.error('Mobile money payment failed', {
        bookingId,
        provider,
        error: paymentResult.error,
      })

      res.status(400).json({
        success: false,
        message: 'Payment processing failed',
        error: paymentResult.error,
      })
    }
  } catch (error) {
    next(error)
  }
}

// Check payment status
export const checkPaymentStatus = async (req, res, next) => {
  try {
    const { bookingId } = req.params

    const booking = await Booking.findById(bookingId)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    if (!booking.paymentTransactionId || !booking.paymentProvider) {
      throw new BadRequestError('No mobile money payment found for this booking')
    }

    const statusResult = await paymentService.checkPaymentStatus(
      booking.paymentProvider,
      booking.paymentTransactionId
    )

    if (statusResult.success) {
      // Update booking status based on payment status
      if (statusResult.status === 'SUCCESSFUL') {
        booking.paymentStatus = 'COMPLETED'
        booking.status = 'confirmed'
      } else if (statusResult.status === 'FAILED') {
        booking.paymentStatus = 'FAILED'
      }

      await booking.save()

      res.status(200).json({
        success: true,
        data: {
          bookingId,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.status,
          transactionId: booking.paymentTransactionId,
          provider: booking.paymentProvider,
        },
      })
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to check payment status',
        error: statusResult.error,
      })
    }
  } catch (error) {
    next(error)
  }
}

// Get payment methods (public endpoint)
export const getPaymentMethods = async (req, res, next) => {
  try {
    // Check feature flags for available payment methods
    const mobileMoneyFlag = await FeatureFlag.findOne({ name: 'enable_mobile_money_payments' })

    const paymentMethods = [
      {
        id: 'cash',
        name: 'Cash Payment',
        description: 'Pay in cash at the venue',
        enabled: true,
        type: 'offline',
      },
    ]

    if (mobileMoneyFlag && mobileMoneyFlag.isEnabled) {
      paymentMethods.push(
        {
          id: 'mobile_money_mtn',
          name: 'MTN Mobile Money',
          description: 'Pay using MTN Mobile Money',
          enabled: true,
          type: 'mobile_money',
          provider: 'MTN',
          icon: 'mtn',
        },
        {
          id: 'mobile_money_airtel',
          name: 'Airtel Money',
          description: 'Pay using Airtel Money',
          enabled: true,
          type: 'mobile_money',
          provider: 'Airtel',
          icon: 'airtel',
        }
      )
    }

    res.status(200).json({
      success: true,
      data: paymentMethods,
    })
  } catch (error) {
    next(error)
  }
}

// Validate phone number
export const validatePhoneNumber = async (req, res, next) => {
  try {
    const { phoneNumber } = req.body

    if (!phoneNumber) {
      throw new BadRequestError('Phone number is required')
    }

    const formattedPhoneNumber = paymentService.formatPhoneNumber(phoneNumber)
    const isValid = paymentService.isValidPhoneNumber(formattedPhoneNumber)

    res.status(200).json({
      success: true,
      data: {
        original: phoneNumber,
        formatted: formattedPhoneNumber,
        isValid,
      },
    })
  } catch (error) {
    next(error)
  }
}
