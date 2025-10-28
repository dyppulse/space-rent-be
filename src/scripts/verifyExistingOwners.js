import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import User from '../models/User.js'

// Load environment variables
dotenv.config({ example: '.env.example', allowEmptyValues: false })

const verifyExistingOwners = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find all users with owner role
    const owners = await User.find({
      $or: [{ role: 'owner' }, { roles: 'owner' }, { 'roles.0': 'owner' }],
    })

    console.log(`Found ${owners.length} owner(s) in the database`)

    if (owners.length === 0) {
      console.log('No owners found to verify')
      await mongoose.connection.close()
      return
    }

    // Update all owners to be verified
    const result = await User.updateMany(
      {
        $or: [{ role: 'owner' }, { roles: 'owner' }, { 'roles.0': 'owner' }],
      },
      {
        $set: {
          isVerified: true,
        },
      }
    )

    console.log(`✅ Verified ${result.modifiedCount} owner(s)`)

    // Display updated owners
    const updatedOwners = await User.find({
      $or: [{ role: 'owner' }, { roles: 'owner' }, { 'roles.0': 'owner' }],
    }).select('name email role roles isVerified')

    console.log('\n📋 Updated Owners:')
    updatedOwners.forEach((owner) => {
      console.log(`- ${owner.name} (${owner.email}) - Verified: ${owner.isVerified}`)
    })

    await mongoose.connection.close()
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the script
verifyExistingOwners()
