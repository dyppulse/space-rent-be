import dotenv from 'dotenv-safe'
import mongoose from 'mongoose'

import County from '../models/County.js'
import District from '../models/District.js'
import Parish from '../models/Parish.js'
import Region from '../models/Region.js'
import Subcounty from '../models/Subcounty.js'
import Village from '../models/Village.js'

dotenv.config({ example: '.env.example', allowEmptyValues: false })

// Uganda administrative hierarchy data
const ugandaData = {
  regions: [
    {
      name: 'Central Region',
      code: 'CR',
      description: 'Central Region of Uganda',
    },
    {
      name: 'Eastern Region',
      code: 'ER',
      description: 'Eastern Region of Uganda',
    },
    {
      name: 'Northern Region',
      code: 'NR',
      description: 'Northern Region of Uganda',
    },
    {
      name: 'Western Region',
      code: 'WR',
      description: 'Western Region of Uganda',
    },
  ],
  districts: [
    // Central Region Districts
    {
      name: 'Kampala',
      code: 'KLA',
      region: 'Central Region',
    },
    {
      name: 'Wakiso',
      code: 'WKS',
      region: 'Central Region',
    },
    {
      name: 'Mukono',
      code: 'MKN',
      region: 'Central Region',
    },
    {
      name: 'Luweero',
      code: 'LWR',
      region: 'Central Region',
    },
    // Eastern Region Districts
    {
      name: 'Jinja',
      code: 'JJA',
      region: 'Eastern Region',
    },
    {
      name: 'Iganga',
      code: 'IGA',
      region: 'Eastern Region',
    },
    {
      name: 'Kamuli',
      code: 'KML',
      region: 'Eastern Region',
    },
    {
      name: 'Mbale',
      code: 'MBL',
      region: 'Eastern Region',
    },
    // Northern Region Districts
    {
      name: 'Gulu',
      code: 'GLU',
      region: 'Northern Region',
    },
    {
      name: 'Lira',
      code: 'LRA',
      region: 'Northern Region',
    },
    {
      name: 'Arua',
      code: 'ARA',
      region: 'Northern Region',
    },
    // Western Region Districts
    {
      name: 'Mbarara',
      code: 'MBR',
      region: 'Western Region',
    },
    {
      name: 'Kasese',
      code: 'KSE',
      region: 'Western Region',
    },
    {
      name: 'Fort Portal',
      code: 'FTP',
      region: 'Western Region',
    },
  ],
  counties: [
    // Kampala Counties
    {
      name: 'Kampala Central',
      code: 'KLC',
      district: 'Kampala',
    },
    {
      name: 'Kawempe',
      code: 'KWP',
      district: 'Kampala',
    },
    {
      name: 'Makindye',
      code: 'MKD',
      district: 'Kampala',
    },
    {
      name: 'Nakawa',
      code: 'NKW',
      district: 'Kampala',
    },
    // Wakiso Counties
    {
      name: 'Entebbe',
      code: 'ETB',
      district: 'Wakiso',
    },
    {
      name: 'Kira',
      code: 'KRA',
      district: 'Wakiso',
    },
    {
      name: 'Nansana',
      code: 'NNS',
      district: 'Wakiso',
    },
    // Jinja Counties
    {
      name: 'Jinja Central',
      code: 'JJC',
      district: 'Jinja',
    },
    {
      name: 'Buwenge',
      code: 'BWG',
      district: 'Jinja',
    },
    // Gulu Counties
    {
      name: 'Gulu Central',
      code: 'GLC',
      district: 'Gulu',
    },
    {
      name: 'Omoro',
      code: 'OMR',
      district: 'Gulu',
    },
  ],
  subcounties: [
    // Kampala Central Subcounties
    {
      name: 'Central Division',
      code: 'CDV',
      county: 'Kampala Central',
    },
    {
      name: 'Nakasero',
      code: 'NKS',
      county: 'Kampala Central',
    },
    {
      name: 'Old Kampala',
      code: 'OKP',
      county: 'Kampala Central',
    },
    // Kawempe Subcounties
    {
      name: 'Kawempe Division',
      code: 'KWD',
      county: 'Kawempe',
    },
    {
      name: 'Bwaise',
      code: 'BWS',
      county: 'Kawempe',
    },
    // Makindye Subcounties
    {
      name: 'Makindye Division',
      code: 'MKD',
      county: 'Makindye',
    },
    {
      name: 'Kibuli',
      code: 'KBL',
      county: 'Makindye',
    },
    // Nakawa Subcounties
    {
      name: 'Nakawa Division',
      code: 'NKD',
      county: 'Nakawa',
    },
    {
      name: 'Ntinda',
      code: 'NTD',
      county: 'Nakawa',
    },
    // Entebbe Subcounties
    {
      name: 'Entebbe Municipality',
      code: 'ETM',
      county: 'Entebbe',
    },
    {
      name: 'Kajjansi',
      code: 'KJS',
      county: 'Entebbe',
    },
    // Jinja Central Subcounties
    {
      name: 'Jinja Municipality',
      code: 'JNM',
      county: 'Jinja Central',
    },
    {
      name: 'Mpumudde',
      code: 'MPD',
      county: 'Jinja Central',
    },
  ],
  parishes: [
    // Central Division Parishes
    {
      name: 'Kampala Central Parish',
      code: 'KCP',
      subcounty: 'Central Division',
    },
    {
      name: 'Nakasero Parish',
      code: 'NKP',
      subcounty: 'Nakasero',
    },
    {
      name: 'Old Kampala Parish',
      code: 'OKP',
      subcounty: 'Old Kampala',
    },
    // Kawempe Division Parishes
    {
      name: 'Kawempe Parish',
      code: 'KWP',
      subcounty: 'Kawempe Division',
    },
    {
      name: 'Bwaise Parish',
      code: 'BWP',
      subcounty: 'Bwaise',
    },
    // Makindye Division Parishes
    {
      name: 'Makindye Parish',
      code: 'MKP',
      subcounty: 'Makindye Division',
    },
    {
      name: 'Kibuli Parish',
      code: 'KBP',
      subcounty: 'Kibuli',
    },
    // Nakawa Division Parishes
    {
      name: 'Nakawa Parish',
      code: 'NKP',
      subcounty: 'Nakawa Division',
    },
    {
      name: 'Ntinda Parish',
      code: 'NTP',
      subcounty: 'Ntinda',
    },
    // Entebbe Municipality Parishes
    {
      name: 'Entebbe Central Parish',
      code: 'ECP',
      subcounty: 'Entebbe Municipality',
    },
    {
      name: 'Kajjansi Parish',
      code: 'KJP',
      subcounty: 'Kajjansi',
    },
    // Jinja Municipality Parishes
    {
      name: 'Jinja Central Parish',
      code: 'JCP',
      subcounty: 'Jinja Municipality',
    },
    {
      name: 'Mpumudde Parish',
      code: 'MPP',
      subcounty: 'Mpumudde',
    },
  ],
  villages: [
    // Kampala Central Parish Villages
    {
      name: 'Kampala Road',
      code: 'KLR',
      parish: 'Kampala Central Parish',
    },
    {
      name: 'Nakasero Hill',
      code: 'NKH',
      parish: 'Nakasero Parish',
    },
    {
      name: 'Old Kampala Market',
      code: 'OKM',
      parish: 'Old Kampala Parish',
    },
    // Kawempe Parish Villages
    {
      name: 'Kawempe Market',
      code: 'KWM',
      parish: 'Kawempe Parish',
    },
    {
      name: 'Bwaise Trading Center',
      code: 'BTC',
      parish: 'Bwaise Parish',
    },
    // Makindye Parish Villages
    {
      name: 'Makindye Hill',
      code: 'MKH',
      parish: 'Makindye Parish',
    },
    {
      name: 'Kibuli Mosque',
      code: 'KBM',
      parish: 'Kibuli Parish',
    },
    // Nakawa Parish Villages
    {
      name: 'Nakawa Industrial Area',
      code: 'NIA',
      parish: 'Nakawa Parish',
    },
    {
      name: 'Ntinda Shopping Center',
      code: 'NSC',
      parish: 'Ntinda Parish',
    },
    // Entebbe Central Parish Villages
    {
      name: 'Entebbe Airport',
      code: 'EAP',
      parish: 'Entebbe Central Parish',
    },
    {
      name: 'Kajjansi Trading Center',
      code: 'KTC',
      parish: 'Kajjansi Parish',
    },
    // Jinja Central Parish Villages
    {
      name: 'Jinja Main Street',
      code: 'JMS',
      parish: 'Jinja Central Parish',
    },
    {
      name: 'Mpumudde Market',
      code: 'MPM',
      parish: 'Mpumudde Parish',
    },
  ],
}

async function seedUgandaLocations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Clear existing data
    console.log('Clearing existing location data...')
    await Village.deleteMany({})
    await Parish.deleteMany({})
    await Subcounty.deleteMany({})
    await County.deleteMany({})
    await District.deleteMany({})
    await Region.deleteMany({})

    // Create regions
    console.log('Creating regions...')
    const regions = await Region.insertMany(ugandaData.regions)
    console.log(`Created ${regions.length} regions`)

    // Create districts
    console.log('Creating districts...')
    const districts = []
    for (const districtData of ugandaData.districts) {
      const region = regions.find((r) => r.name === districtData.region)
      if (region) {
        const district = await District.create({
          name: districtData.name,
          code: districtData.code,
          region: region._id,
        })
        districts.push(district)
      }
    }
    console.log(`Created ${districts.length} districts`)

    // Create counties
    console.log('Creating counties...')
    const counties = []
    for (const countyData of ugandaData.counties) {
      const district = districts.find((d) => d.name === countyData.district)
      if (district) {
        const county = await County.create({
          name: countyData.name,
          code: countyData.code,
          district: district._id,
        })
        counties.push(county)
      }
    }
    console.log(`Created ${counties.length} counties`)

    // Create subcounties
    console.log('Creating subcounties...')
    const subcounties = []
    for (const subcountyData of ugandaData.subcounties) {
      const county = counties.find((c) => c.name === subcountyData.county)
      if (county) {
        const subcounty = await Subcounty.create({
          name: subcountyData.name,
          code: subcountyData.code,
          county: county._id,
        })
        subcounties.push(subcounty)
      }
    }
    console.log(`Created ${subcounties.length} subcounties`)

    // Create parishes
    console.log('Creating parishes...')
    const parishes = []
    for (const parishData of ugandaData.parishes) {
      const subcounty = subcounties.find((s) => s.name === parishData.subcounty)
      if (subcounty) {
        const parish = await Parish.create({
          name: parishData.name,
          code: parishData.code,
          subcounty: subcounty._id,
        })
        parishes.push(parish)
      }
    }
    console.log(`Created ${parishes.length} parishes`)

    // Create villages
    console.log('Creating villages...')
    const villages = []
    for (const villageData of ugandaData.villages) {
      const parish = parishes.find((p) => p.name === villageData.parish)
      if (parish) {
        const village = await Village.create({
          name: villageData.name,
          code: villageData.code,
          parish: parish._id,
        })
        villages.push(village)
      }
    }
    console.log(`Created ${villages.length} villages`)

    console.log('\n✅ Uganda location hierarchy seeded successfully!')
    console.log(`📊 Summary:`)
    console.log(`   - Regions: ${regions.length}`)
    console.log(`   - Districts: ${districts.length}`)
    console.log(`   - Counties: ${counties.length}`)
    console.log(`   - Subcounties: ${subcounties.length}`)
    console.log(`   - Parishes: ${parishes.length}`)
    console.log(`   - Villages: ${villages.length}`)
  } catch (error) {
    console.error('Error seeding Uganda locations:', error)
  } finally {
    await mongoose.disconnect()
    process.exit(0)
  }
}

seedUgandaLocations()
