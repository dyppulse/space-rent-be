import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import User from '../models/User.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

const fixOwnerRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find all owner users
    const owners = await User.find({ role: 'owner' })
    console.log(`Found ${owners.length} owner(s) in the database`)

    let fixed = 0
    for (const user of owners) {
      // If user has role='owner' but roles array doesn't include 'owner'
      if (!user.roles.includes('owner')) {
        user.roles = ['client', 'owner']
        if (!user.activeRole || user.activeRole === 'client') {
          user.activeRole = 'owner'
        }
        await user.save()
        fixed++
        console.log(
          `✅ Fixed: ${user.name} (${user.email}) - roles: [${user.roles.join(', ')}], active: ${user.activeRole}`
        )
      }
    }

    console.log(`\n✅ Fixed ${fixed} owner(s)`)

    // Display all owners
    const allOwners = await User.find({ role: 'owner' }).select(
      'name email role roles activeRole isVerified'
    )
    console.log('\n📋 All Owners:')
    allOwners.forEach((u) => {
      console.log(`- ${u.name} (${u.email})`)
      console.log(
        `  Role: ${u.role}, Roles: [${u.roles.join(', ')}], Active: ${u.activeRole}, Verified: ${u.isVerified}`
      )
    })

    await mongoose.connection.close()
    console.log('\n✅ Script completed successfully')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

fixOwnerRoles()
