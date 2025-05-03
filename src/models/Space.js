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
      city: {
        type: String,
        required: [true, 'Please provide a city'],
      },
      state: {
        type: String,
        required: [true, 'Please provide a state'],
      },
      zipCode: {
        type: String,
        required: [true, 'Please provide a zip code'],
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
      enum: ['event venue', 'wedding location', 'studio', 'conference room', 'other'],
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

// Index for search
spaceSchema.index({
  'location.city': 'text',
  'location.state': 'text',
  name: 'text',
  spaceType: 'text',
})

const Space = mongoose.model('Space', spaceSchema)

export default Space
