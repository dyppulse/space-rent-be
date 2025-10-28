import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import User from '../models/User.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

const syncUserRoles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ Connected to MongoDB')

    // Find all users
    const users = await User.find({})
    console.log(`Found ${users.length} user(s) in the database`)

    let synced = 0
    for (const user of users) {
      let needsUpdate = false

      // If user has no roles array or it's empty
      if (!user.roles || user.roles.length === 0) {
        needsUpdate = true

        if (user.role === 'owner') {
          user.roles = ['client', 'owner']
          if (!user.activeRole) {
            user.activeRole = 'owner'
          }
        } else if (user.role === 'superadmin') {
          user.roles = ['superadmin']
          if (!user.activeRole) {
            user.activeRole = 'superadmin'
          }
        } else {
          user.roles = ['client']
          if (!user.activeRole) {
            user.activeRole = 'client'
          }
        }
      }

      // Ensure activeRole is set
      if (!user.activeRole && user.roles && user.roles.length > 0) {
        user.activeRole = user.roles[0]
        needsUpdate = true
      }

      if (needsUpdate) {
        await user.save()
        synced++
        console.log(`✅ Synced: ${user.name} (${user.email}) - roles: [${user.roles.join(', ')}]`)
      }
    }

    console.log(`\n✅ Synced ${synced} user(s)`)

    // Display all users
    const allUsers = await User.find({}).select('name email role roles activeRole isVerified')
    console.log('\n📋 All Users:')
    allUsers.forEach((u) => {
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

syncUserRoles()
