import mongoose from 'mongoose'

const subcountySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subcounty name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Subcounty code is required'],
      trim: true,
      uppercase: true,
    },
    county: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'County',
      required: [true, 'County is required'],
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

// Ensure unique subcounty names within a county
subcountySchema.index({ name: 1, county: 1 }, { unique: true })

// Transform _id to id for consistency with frontend
subcountySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('Subcounty', subcountySchema)
