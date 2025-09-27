import mongoose from 'mongoose'

const spaceTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a space type name'],
      trim: true,
      unique: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: [200, 'Description cannot be more than 200 characters'],
    },
    icon: {
      type: String,
      required: false,
      trim: true,
      default: 'event',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

// Index for efficient queries
spaceTypeSchema.index({ name: 1 })
spaceTypeSchema.index({ isActive: 1 })

const SpaceType = mongoose.model('SpaceType', spaceTypeSchema)

export default SpaceType
