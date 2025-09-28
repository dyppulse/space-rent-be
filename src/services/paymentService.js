import axios from 'axios'

import logger from '../utils/logger.js'

// Mobile Money Payment Service
class PaymentService {
  constructor() {
    this.mtnApiUrl = process.env.MTN_MOBILE_MONEY_API_URL || 'https://sandbox.momodeveloper.mtn.com'
    this.airtelApiUrl =
      process.env.AIRTEL_MOBILE_MONEY_API_URL || 'https://openapiuat.airtel.africa'
    this.mtnApiKey = process.env.MTN_API_KEY
    this.airtelApiKey = process.env.AIRTEL_API_KEY
  }

  // MTN Mobile Money Payment
  async processMTNPayment(paymentData) {
    try {
      const { phoneNumber, amount, currency, reference, description } = paymentData

      logger.info('Processing MTN Mobile Money payment', {
        phoneNumber: phoneNumber.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2'), // Mask phone number
        amount,
        currency,
        reference,
      })

      // MTN API Integration
      const mtnPayload = {
        amount: amount.toString(),
        currency: currency || 'UGX',
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: description || 'Space booking payment',
        payeeNote: `Payment for booking ${reference}`,
      }

      const response = await axios.post(
        `${this.mtnApiUrl}/collection/v1_0/requesttopay`,
        mtnPayload,
        {
          headers: {
            Authorization: `Bearer ${this.mtnApiKey}`,
            'Content-Type': 'application/json',
            'X-Target-Environment': process.env.MTN_ENVIRONMENT || 'sandbox',
          },
        }
      )

      logger.info('MTN payment request successful', { reference, status: response.status })

      return {
        success: true,
        provider: 'MTN',
        transactionId: response.data.transactionId,
        status: 'PENDING',
        message: 'Payment request sent to MTN Mobile Money',
        data: response.data,
      }
    } catch (error) {
      logger.error('MTN payment failed', {
        error: error.message,
        reference: paymentData.reference,
        phoneNumber: paymentData.phoneNumber.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2'),
      })

      return {
        success: false,
        provider: 'MTN',
        error: error.response?.data?.message || error.message,
        status: 'FAILED',
      }
    }
  }

  // Airtel Money Payment
  async processAirtelPayment(paymentData) {
    try {
      const { phoneNumber, amount, currency, reference, description } = paymentData

      logger.info('Processing Airtel Money payment', {
        phoneNumber: phoneNumber.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2'),
        amount,
        currency,
        reference,
      })

      // Airtel API Integration
      const airtelPayload = {
        amount: amount.toString(),
        currency: currency || 'UGX',
        externalId: reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: phoneNumber,
        },
        payerMessage: description || 'Space booking payment',
        payeeNote: `Payment for booking ${reference}`,
      }

      const response = await axios.post(
        `${this.airtelApiUrl}/merchant/v1/payments/`,
        airtelPayload,
        {
          headers: {
            Authorization: `Bearer ${this.airtelApiKey}`,
            'Content-Type': 'application/json',
            'X-Country': 'UG',
            'X-Currency': currency || 'UGX',
          },
        }
      )

      logger.info('Airtel payment request successful', { reference, status: response.status })

      return {
        success: true,
        provider: 'Airtel',
        transactionId: response.data.transactionId,
        status: 'PENDING',
        message: 'Payment request sent to Airtel Money',
        data: response.data,
      }
    } catch (error) {
      logger.error('Airtel payment failed', {
        error: error.message,
        reference: paymentData.reference,
        phoneNumber: paymentData.phoneNumber.replace(/(\d{3})\d{3}(\d{3})/, '$1***$2'),
      })

      return {
        success: false,
        provider: 'Airtel',
        error: error.response?.data?.message || error.message,
        status: 'FAILED',
      }
    }
  }

  // Process Mobile Money Payment (Generic)
  async processMobileMoneyPayment(paymentData) {
    const { provider, phoneNumber, amount } = paymentData

    // Validate phone number format
    if (!this.isValidPhoneNumber(phoneNumber)) {
      return {
        success: false,
        error: 'Invalid phone number format. Use format: 256XXXXXXXXX',
        status: 'FAILED',
      }
    }

    // Validate amount
    if (amount <= 0) {
      return {
        success: false,
        error: 'Amount must be greater than 0',
        status: 'FAILED',
      }
    }

    switch (provider.toUpperCase()) {
      case 'MTN':
        return await this.processMTNPayment(paymentData)
      case 'AIRTEL':
        return await this.processAirtelPayment(paymentData)
      default:
        return {
          success: false,
          error: 'Unsupported mobile money provider',
          status: 'FAILED',
        }
    }
  }

  // Validate phone number format
  isValidPhoneNumber(phoneNumber) {
    // Remove any spaces or special characters
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '')

    // Check if it starts with country code
    if (cleaned.startsWith('256')) {
      return /^256\d{9}$/.test(cleaned)
    }

    // Check if it's a local format
    if (cleaned.startsWith('0')) {
      return /^0\d{9}$/.test(cleaned)
    }

    return false
  }

  // Format phone number to international format
  formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/[\s\-()]/g, '')

    if (cleaned.startsWith('256')) {
      return cleaned
    }

    if (cleaned.startsWith('0')) {
      return '256' + cleaned.substring(1)
    }

    return '256' + cleaned
  }

  // Check payment status
  async checkPaymentStatus(provider, transactionId) {
    try {
      let response

      if (provider.toUpperCase() === 'MTN') {
        response = await axios.get(
          `${this.mtnApiUrl}/collection/v1_0/requesttopay/${transactionId}`,
          {
            headers: {
              Authorization: `Bearer ${this.mtnApiKey}`,
              'X-Target-Environment': process.env.MTN_ENVIRONMENT || 'sandbox',
            },
          }
        )
      } else if (provider.toUpperCase() === 'AIRTEL') {
        response = await axios.get(`${this.airtelApiUrl}/merchant/v1/payments/${transactionId}`, {
          headers: {
            Authorization: `Bearer ${this.airtelApiKey}`,
            'X-Country': 'UG',
          },
        })
      }

      return {
        success: true,
        status: response.data.status,
        data: response.data,
      }
    } catch (error) {
      logger.error('Payment status check failed', {
        provider,
        transactionId,
        error: error.message,
      })

      return {
        success: false,
        error: error.message,
      }
    }
  }
}

export default new PaymentService()
