import mongoose from 'mongoose'

const spaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a space name'],
      trim: true,
      maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    location: {
      address: {
        type: String,
        required: [true, 'Please provide an address'],
      },
      // Uganda hierarchy (denormalized for simplicity). Consider seeding canonical lists if needed.
      district: {
        type: String,
        required: false,
        trim: true,
      },
      county: {
        type: String,
        required: false,
        trim: true,
      },
      subCounty: {
        type: String,
        required: false,
        trim: true,
      },
      parish: {
        type: String,
        required: false,
        trim: true,
      },
      village: {
        type: String,
        required: false,
        trim: true,
      },
      // GeoJSON point for maps and geospatial queries
      point: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number], // [lng, lat]
          index: '2dsphere',
          default: undefined,
        },
      },
      // Legacy fields kept for backward compatibility (non-required)
      city: {
        type: String,
        required: false,
      },
      state: {
        type: String,
        required: false,
      },
      zipCode: {
        type: String,
        required: false,
      },
      coordinates: {
        lat: {
          type: Number,
        },
        lng: {
          type: Number,
        },
      },
    },
    price: {
      amount: {
        type: Number,
        required: [true, 'Please provide a price'],
      },
      unit: {
        type: String,
        enum: ['hour', 'day', 'event'],
        default: 'day',
      },
    },
    capacity: {
      type: Number,
    },
    spaceType: {
      type: String,
      // enum: ['event venue', 'wedding location', 'studio', 'conference room', 'other'],
      required: [true, 'Please provide a space type'],
    },
    amenities: {
      type: [String],
      default: [],
    },
    images: [
      {
        public_id: { type: String, required: true },
        url: { type: String, required: true },
      },
    ],
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please provide space owner'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Virtual for bookings
spaceSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'space',
  justOne: false,
})

// Text index for keyword search across select fields
spaceSchema.index({
  'location.district': 'text',
  'location.county': 'text',
  'location.subCounty': 'text',
  'location.village': 'text',
  'location.city': 'text', // legacy support
  'location.state': 'text', // legacy support
  name: 'text',
  spaceType: 'text',
})

// Geospatial index for near queries
spaceSchema.index({ 'location.point': '2dsphere' })

const Space = mongoose.model('Space', spaceSchema)

export default Space
