import mongoose from 'mongoose'

const districtSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'District name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'District code is required'],
      trim: true,
      uppercase: true,
    },
    region: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Region',
      required: [true, 'Region is required'],
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

// Ensure unique district names within a region
districtSchema.index({ name: 1, region: 1 }, { unique: true })

// Transform _id to id for consistency with frontend
districtSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('District', districtSchema)
