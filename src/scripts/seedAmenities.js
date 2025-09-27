import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import Amenity from '../models/Amenity.js'
import User from '../models/User.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

const commonAmenities = [
  {
    name: 'WiFi',
    description: 'High-speed internet connection available',
    icon: 'wifi',
    sortOrder: 1,
  },
  {
    name: 'Sound System',
    description: 'Professional audio equipment for events',
    icon: 'volume_up',
    sortOrder: 2,
  },
  {
    name: 'Projector',
    description: 'Audio-visual equipment for presentations',
    icon: 'videocam',
    sortOrder: 3,
  },
  {
    name: 'Kitchen',
    description: 'Cooking facilities and food preparation area',
    icon: 'kitchen',
    sortOrder: 4,
  },
  {
    name: 'Restrooms',
    description: 'Clean and accessible restroom facilities',
    icon: 'wc',
    sortOrder: 5,
  },
  {
    name: 'Heating/AC',
    description: 'Climate control for comfortable temperature',
    icon: 'ac_unit',
    sortOrder: 6,
  },
  {
    name: 'Furniture',
    description: 'Tables, chairs, and seating arrangements',
    icon: 'chair',
    sortOrder: 7,
  },
  {
    name: 'Parking',
    description: 'On-site parking facilities',
    icon: 'local_parking',
    sortOrder: 8,
  },
  {
    name: 'Wheelchair Accessible',
    description: 'Accessible for people with disabilities',
    icon: 'accessible',
    sortOrder: 9,
  },
  {
    name: 'Catering',
    description: 'Food and beverage services available',
    icon: 'restaurant',
    sortOrder: 10,
  },
  {
    name: 'Lighting Equipment',
    description: 'Professional lighting for events',
    icon: 'lightbulb',
    sortOrder: 11,
  },
  {
    name: 'Stage',
    description: 'Performance stage or platform',
    icon: 'stage',
    sortOrder: 12,
  },
  {
    name: 'Tables/Chairs',
    description: 'Flexible seating and table arrangements',
    icon: 'table_restaurant',
    sortOrder: 13,
  },
  {
    name: 'Dressing Room',
    description: 'Private changing and preparation area',
    icon: 'checkroom',
    sortOrder: 14,
  },
  {
    name: 'Outdoor Space',
    description: 'Access to outdoor areas or gardens',
    icon: 'park',
    sortOrder: 15,
  },
  {
    name: 'Security',
    description: 'On-site security services',
    icon: 'security',
    sortOrder: 16,
  },
  {
    name: 'Cleaning Services',
    description: 'Professional cleaning and maintenance',
    icon: 'cleaning_services',
    sortOrder: 17,
  },
  {
    name: 'Storage',
    description: 'Storage space for equipment and belongings',
    icon: 'inventory',
    sortOrder: 18,
  },
  {
    name: 'Power Outlets',
    description: 'Multiple electrical outlets for devices',
    icon: 'electrical_services',
    sortOrder: 19,
  },
  {
    name: 'Whiteboard',
    description: 'Writing surfaces for presentations',
    icon: 'edit',
    sortOrder: 20,
  },
]

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Find or create an admin user to assign as creator
    let adminUser = await User.findOne({ role: { $in: ['admin', 'superadmin'] } })

    if (!adminUser) {
      // If no admin exists, create a default one
      adminUser = await User.create({
        name: 'System Admin',
        email: 'system@spacehire.local',
        password: 'SystemAdmin123!',
        phone: '0000000000',
        role: 'superadmin',
      })
      console.log('Created system admin user for amenities')
    }

    console.log(`Using admin user: ${adminUser.email}`)

    // Clear existing amenities (optional - remove if you want to keep existing ones)
    // await Amenity.deleteMany({})
    // console.log('Cleared existing amenities')

    let createdCount = 0
    let skippedCount = 0

    for (const amenityData of commonAmenities) {
      try {
        const existingAmenity = await Amenity.findOne({ name: amenityData.name })

        if (existingAmenity) {
          console.log(`Amenity "${amenityData.name}" already exists, skipping`)
          skippedCount++
          continue
        }

        const amenity = await Amenity.create({
          ...amenityData,
        })

        console.log(`Created amenity: ${amenity.name}`)
        createdCount++
      } catch (error) {
        console.error(`Error creating amenity "${amenityData.name}":`, error.message)
      }
    }

    console.log('\n=== Amenities Seeding Complete ===')
    console.log(`Created: ${createdCount} amenities`)
    console.log(`Skipped: ${skippedCount} existing amenities`)
    console.log(`Total: ${commonAmenities.length} amenities processed`)

    // Show all amenities
    const allAmenities = await Amenity.find({}).sort({ sortOrder: 1 })
    console.log('\nAll amenities in database:')
    allAmenities.forEach((amenity) => {
      console.log(
        `- ${amenity.name} (${amenity.isActive ? 'Active' : 'Inactive'}) - Order: ${amenity.sortOrder}`
      )
    })
  } catch (err) {
    console.error('Error seeding amenities:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

run()
