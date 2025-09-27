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
      // Hierarchical location references
      region: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Region',
        required: false,
      },
      district: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'District',
        required: false,
      },
      county: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'County',
        required: false,
      },
      subcounty: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcounty',
        required: false,
      },
      parish: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Parish',
        required: false,
      },
      village: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Village',
        required: false,
      },
      // Legacy string fields for backward compatibility
      districtName: {
        type: String,
        required: false,
        trim: true,
      },
      countyName: {
        type: String,
        required: false,
        trim: true,
      },
      subCountyName: {
        type: String,
        required: false,
        trim: true,
      },
      parishName: {
        type: String,
        required: false,
        trim: true,
      },
      villageName: {
        type: String,
        required: false,
        trim: true,
      },
      // GeoJSON point for maps and geospatial queries
      point: {
        type: {
          type: String,
          enum: ['Point'],
          required: false,
        },
        coordinates: {
          type: [Number], // [lng, lat]
          required: false,
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
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
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

// Pre-save middleware to handle geospatial point validation
spaceSchema.pre('save', function (next) {
  // Only create point if coordinates are provided
  if (
    this.location &&
    this.location.point &&
    this.location.point.coordinates &&
    this.location.point.coordinates.length === 2
  ) {
    // Ensure the point has the correct structure
    this.location.point.type = 'Point'
    // coordinates should be [longitude, latitude]
  } else if (this.location && this.location.point) {
    // If point exists but no valid coordinates, remove it
    delete this.location.point
  }
  next()
})

const Space = mongoose.model('Space', spaceSchema)

export default Space
