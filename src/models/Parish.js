import mongoose from 'mongoose'

const parishSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Parish name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Parish code is required'],
      trim: true,
      uppercase: true,
    },
    subcounty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subcounty',
      required: [true, 'Subcounty is required'],
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

// Ensure unique parish names within a subcounty
parishSchema.index({ name: 1, subcounty: 1 }, { unique: true })

// Transform _id to id for consistency with frontend
parishSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('Parish', parishSchema)
