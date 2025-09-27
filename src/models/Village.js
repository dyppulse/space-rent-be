import mongoose from 'mongoose'

const villageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Village name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Village code is required'],
      trim: true,
      uppercase: true,
    },
    parish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Parish',
      required: [true, 'Parish is required'],
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

// Ensure unique village names within a parish
villageSchema.index({ name: 1, parish: 1 }, { unique: true })

// Transform _id to id for consistency with frontend
villageSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('Village', villageSchema)
