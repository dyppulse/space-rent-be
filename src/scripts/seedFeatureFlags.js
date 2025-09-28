import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import FeatureFlag from '../models/FeatureFlag.js'
import User from '../models/User.js'
import logger from '../utils/logger.js'

// Load environment variables
dotenv.config()

const seedFeatureFlags = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('Connected to MongoDB')

    // Find the first admin user to use as creator
    const adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } })
    if (!adminUser) {
      logger.error('No admin user found. Please create an admin user first.')
      process.exit(1)
    }

    const featureFlags = [
      {
        name: 'enable_mobile_money_payments',
        description: 'Enable mobile money payment options (MTN and Airtel) for bookings',
        isEnabled: true,
        category: 'payment',
        config: {
          providers: ['MTN', 'Airtel'],
          currencies: ['UGX'],
          minAmount: 1000,
          maxAmount: 10000000,
        },
        createdBy: adminUser._id,
      },
      {
        name: 'enable_booking_notifications',
        description: 'Send email and SMS notifications for booking confirmations',
        isEnabled: true,
        category: 'booking',
        config: {
          emailNotifications: true,
          smsNotifications: false,
        },
        createdBy: adminUser._id,
      },
      {
        name: 'enable_advanced_booking_features',
        description: 'Enable advanced booking features like recurring bookings and waitlists',
        isEnabled: false,
        category: 'booking',
        config: {
          recurringBookings: false,
          waitlist: false,
          autoConfirm: false,
        },
        createdBy: adminUser._id,
      },
      {
        name: 'enable_space_availability_calendar',
        description: 'Show real-time availability calendar for spaces',
        isEnabled: true,
        category: 'ui',
        config: {
          showCalendar: true,
          allowMultipleSelection: true,
        },
        createdBy: adminUser._id,
      },
      {
        name: 'enable_guest_management',
        description: 'Allow detailed guest management and check-in features',
        isEnabled: false,
        category: 'booking',
        config: {
          guestCheckIn: false,
          guestRegistration: false,
          guestBadges: false,
        },
        createdBy: adminUser._id,
      },
    ]

    // Clear existing feature flags
    await FeatureFlag.deleteMany({})
    logger.info('Cleared existing feature flags')

    // Create new feature flags
    const createdFlags = await FeatureFlag.insertMany(featureFlags)
    logger.info(`Created ${createdFlags.length} feature flags`)

    // Log the created flags
    createdFlags.forEach((flag) => {
      logger.info(`Created feature flag: ${flag.name} (${flag.isEnabled ? 'enabled' : 'disabled'})`)
    })

    logger.info('Feature flags seeding completed successfully')
  } catch (error) {
    logger.error('Error seeding feature flags:', error)
  } finally {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the seeding function
seedFeatureFlags()
