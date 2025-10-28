import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['owner', 'client', 'superadmin'],
      default: 'client',
    },
    // Multiple roles support
    roles: {
      type: [String],
      enum: ['client', 'owner', 'superadmin'],
      default: ['client'],
    },
    activeRole: {
      type: String,
      enum: ['client', 'owner'],
      default: 'client',
    },
    // Verification flags
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    // Owner-specific verification
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationInfo: {
      nationalId: String,
      businessName: String,
      businessRegistrationNumber: String,
      businessLocation: String,
      propertyAddress: String,
      propertyType: {
        type: String,
        enum: ['owned', 'leased', 'other'],
      },
      contactPersonName: String,
      contactPersonPhone: String,
      documents: {
        businessLicense: String, // URL to uploaded document
        nationalId: String,
        proofOfOwnership: String,
        otherDocuments: [String],
      },
      submittedAt: Date,
    },
    // Client to Owner upgrade request
    upgradeRequest: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
      },
      submittedAt: Date,
      reviewedAt: Date,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      rejectionReason: String,
      verificationInfo: {
        nationalId: String,
        businessName: String,
        businessRegistrationNumber: String,
        businessLocation: String,
        propertyAddress: String,
        propertyType: {
          type: String,
          enum: ['owned', 'leased', 'other'],
        },
        contactPersonName: String,
        contactPersonPhone: String,
        documents: {
          businessLicense: String,
          nationalId: String,
          proofOfOwnership: String,
          otherDocuments: [String],
        },
      },
    },
  },
  { timestamps: true }
)

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Sync roles array with role field
userSchema.pre('save', function (next) {
  // If this is a new document and roles array is empty, set it based on role
  if (this.isNew && (!this.roles || this.roles.length === 0)) {
    if (this.role === 'owner') {
      this.roles = ['client', 'owner']
      this.activeRole = 'owner'
    } else if (this.role === 'client') {
      this.roles = ['client']
      this.activeRole = 'client'
    } else {
      this.roles = [this.role]
    }
  }

  // Sync role field with activeRole for backward compatibility
  if (this.activeRole && this.activeRole !== this.role) {
    this.role = this.activeRole
  }

  next()
})

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// Generate JWT token
userSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id, name: this.name, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME || '30d',
  })
}

// Transform _id to id for consistency with frontend
userSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    return ret
  },
})

const User = mongoose.model('User', userSchema)

export default User
