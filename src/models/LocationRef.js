import mongoose from 'mongoose'

// Optional reference dataset for Uganda administrative hierarchy
// Each document represents the full path for simpler querying
const locationRefSchema = new mongoose.Schema(
  {
    district: { type: String, required: true, trim: true },
    county: { type: String, required: false, trim: true },
    subCounty: { type: String, required: false, trim: true },
    parish: { type: String, required: false, trim: true },
    village: { type: String, required: false, trim: true },
    isActive: { type: Boolean, default: true },
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

locationRefSchema.index(
  { district: 1, county: 1, subCounty: 1, parish: 1, village: 1 },
  { unique: true, sparse: true }
)

const LocationRef = mongoose.model('LocationRef', locationRefSchema)

export default LocationRef
