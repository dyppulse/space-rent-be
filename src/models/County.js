import mongoose from 'mongoose'

const countySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'County name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'County code is required'],
      trim: true,
      uppercase: true,
    },
    district: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'District',
      required: [true, 'District is required'],
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

// Ensure unique county names within a district
countySchema.index({ name: 1, district: 1 }, { unique: true })

// Transform _id to id for consistency with frontend
countySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('County', countySchema)
