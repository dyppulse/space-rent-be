import mongoose from 'mongoose'

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide an amenity name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters'],
    },
    icon: {
      type: String,
      required: [true, 'Please provide an icon'],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Index for efficient queries (name index is already created by unique: true)
amenitySchema.index({ isActive: 1, sortOrder: 1 })

const Amenity = mongoose.model('Amenity', amenitySchema)

export default Amenity
