import mongoose from 'mongoose'

const regionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Region name is required'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Region code is required'],
      trim: true,
      unique: true,
      uppercase: true,
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

// Transform _id to id for consistency with frontend
regionSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

export default mongoose.model('Region', regionSchema)
