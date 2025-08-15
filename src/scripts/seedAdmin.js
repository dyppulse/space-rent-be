import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import User from '../models/User.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    const email = process.env.QA_SUPERADMIN_EMAIL || 'qa.superadmin@spacehire.local'
    const password = process.env.QA_SUPERADMIN_PASSWORD || 'QA-SuperAdmin123!'
    const name = process.env.QA_SUPERADMIN_NAME || 'QA Super Admin'
    const phone = process.env.QA_ADMIN_PHONE || '0700000000'

    let user = await User.findOne({ email })
    if (user) {
      if (user.role !== 'superadmin') {
        user.role = 'superadmin'
        await user.save()
      }
      console.log('Super admin user already exists:', email)
    } else {
      user = await User.create({ name, email, password, phone, role: 'superadmin' })
      console.log('Super admin user created:', email)
    }

    console.log('Credentials:')
    console.log('Email:', email)
    console.log('Password:', password)
  } catch (err) {
    console.error(err)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

run()
