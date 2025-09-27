import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import SpaceType from '../models/SpaceType.js'
import User from '../models/User.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

const commonSpaceTypes = [
  {
    name: 'Event Venue',
    description: 'Large spaces perfect for conferences, seminars, and corporate events',
    icon: 'business',
  },
  {
    name: 'Wedding Venue',
    description: 'Beautiful spaces ideal for weddings and romantic celebrations',
    icon: 'favorite',
  },
  {
    name: 'Conference Room',
    description: 'Professional meeting rooms for business presentations and discussions',
    icon: 'meeting_room',
  },
  {
    name: 'Studio',
    description: 'Creative spaces for photography, art, and multimedia production',
    icon: 'photo_camera',
  },
  {
    name: 'Exhibition Hall',
    description: 'Large open spaces for trade shows, exhibitions, and displays',
    icon: 'view_module',
  },
  {
    name: 'Auditorium',
    description: 'Theater-style spaces for performances, lectures, and presentations',
    icon: 'theater_comedy',
  },
  {
    name: 'Banquet Hall',
    description: 'Elegant spaces for formal dinners, galas, and special occasions',
    icon: 'restaurant',
  },
  {
    name: 'Training Room',
    description: 'Educational spaces equipped for workshops and training sessions',
    icon: 'school',
  },
  {
    name: 'Reception Hall',
    description: 'Versatile spaces for parties, gatherings, and social events',
    icon: 'celebration',
  },
  {
    name: 'Gallery',
    description: 'Art galleries and exhibition spaces for showcasing creative work',
    icon: 'museum',
  },
  {
    name: 'Ballroom',
    description: 'Grand spaces for formal dances, galas, and elegant events',
    icon: 'dance',
  },
  {
    name: 'Outdoor Space',
    description: 'Open-air venues for outdoor events, festivals, and gatherings',
    icon: 'park',
  },
  {
    name: 'Workshop',
    description: 'Industrial spaces for hands-on activities and manufacturing',
    icon: 'build',
  },
  {
    name: 'Sports Hall',
    description: 'Athletic facilities for sports events and physical activities',
    icon: 'sports',
  },
  {
    name: 'Co-working Space',
    description: 'Flexible workspaces for remote workers and entrepreneurs',
    icon: 'work',
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
      console.log('Created system admin user for space types')
    }

    console.log(`Using admin user: ${adminUser.email}`)

    // Clear existing space types (optional - remove if you want to keep existing ones)
    // await SpaceType.deleteMany({})
    // console.log('Cleared existing space types')

    let createdCount = 0
    let skippedCount = 0

    for (const spaceTypeData of commonSpaceTypes) {
      try {
        const existingSpaceType = await SpaceType.findOne({ name: spaceTypeData.name })

        if (existingSpaceType) {
          console.log(`Space type "${spaceTypeData.name}" already exists, skipping`)
          skippedCount++
          continue
        }

        const spaceType = await SpaceType.create({
          ...spaceTypeData,
          createdBy: adminUser._id,
        })

        console.log(`Created space type: ${spaceType.name}`)
        createdCount++
      } catch (error) {
        console.error(`Error creating space type "${spaceTypeData.name}":`, error.message)
      }
    }

    console.log('\n=== Space Types Seeding Complete ===')
    console.log(`Created: ${createdCount} space types`)
    console.log(`Skipped: ${skippedCount} existing space types`)
    console.log(`Total: ${commonSpaceTypes.length} space types processed`)

    // Show all space types
    const allSpaceTypes = await SpaceType.find({}).sort({ name: 1 })
    console.log('\nAll space types in database:')
    allSpaceTypes.forEach((st) => {
      console.log(`- ${st.name} (${st.isActive ? 'Active' : 'Inactive'})`)
    })
  } catch (err) {
    console.error('Error seeding space types:', err)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
    process.exit(0)
  }
}

run()
