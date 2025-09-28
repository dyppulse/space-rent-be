import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import FeatureFlag from '../models/FeatureFlag.js'
import logger from '../utils/logger.js'

// Load environment variables
dotenv.config()

const checkFeatureFlags = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    logger.info('Connected to MongoDB')

    const flags = await FeatureFlag.find({}).sort({ category: 1, name: 1 })

    console.log('\n=== Feature Flags Status ===')
    flags.forEach((flag) => {
      const status = flag.isEnabled ? '✅ ENABLED' : '❌ DISABLED'
      console.log(`${status} - ${flag.name} (${flag.category})`)
      console.log(`   Description: ${flag.description}`)
      if (Object.keys(flag.config || {}).length > 0) {
        console.log(`   Config: ${JSON.stringify(flag.config)}`)
      }
      console.log('')
    })

    // Check specifically for mobile money
    const mobileMoneyFlag = flags.find((flag) => flag.name === 'enable_mobile_money_payments')
    if (mobileMoneyFlag) {
      console.log('🎯 Mobile Money Payments Status:')
      console.log(`   Status: ${mobileMoneyFlag.isEnabled ? 'ENABLED' : 'DISABLED'}`)
      console.log(
        `   Providers: ${mobileMoneyFlag.config?.providers?.join(', ') || 'Not configured'}`
      )
      console.log(
        `   Currencies: ${mobileMoneyFlag.config?.currencies?.join(', ') || 'Not configured'}`
      )
    }

    logger.info('Feature flags check completed')
  } catch (error) {
    logger.error('Error checking feature flags:', error)
  } finally {
    await mongoose.disconnect()
    logger.info('Disconnected from MongoDB')
    process.exit(0)
  }
}

// Run the check
checkFeatureFlags()
