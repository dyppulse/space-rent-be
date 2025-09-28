import mongoose from 'mongoose'

const featureFlagSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Feature flag name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Feature flag description is required'],
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ['payment', 'booking', 'ui', 'integration', 'other'],
      default: 'other',
    },
    config: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
      transform: function (doc, ret) {
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Index for efficient querying
featureFlagSchema.index({ name: 1 })
featureFlagSchema.index({ category: 1 })
featureFlagSchema.index({ isEnabled: 1 })

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema)

export default FeatureFlag
