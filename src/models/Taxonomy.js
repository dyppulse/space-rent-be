import mongoose from 'mongoose'

const taxonomySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['spaceType', 'amenity'],
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
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
  { timestamps: true }
)

taxonomySchema.index({ type: 1, key: 1 }, { unique: true })

const Taxonomy = mongoose.model('Taxonomy', taxonomySchema)

export default Taxonomy
