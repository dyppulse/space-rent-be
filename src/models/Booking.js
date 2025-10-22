import mongoose from 'mongoose'

const bookingSchema = new mongoose.Schema(
  {
    space: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Space',
      required: [true, 'Space is required'],
    },
    clientName: {
      type: String,
      required: [true, 'Client name is required'],
      trim: true,
    },
    clientEmail: {
      type: String,
      required: [true, 'Client email is required'],
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
      trim: true,
      lowercase: true,
    },
    clientPhone: {
      type: String,
      required: [true, 'Client phone is required'],
      trim: true,
    },
    bookingType: {
      type: String,
      enum: ['single', 'multi'],
      required: [true, 'Booking type is required'],
      default: 'single',
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
    },
    checkInDate: {
      type: Date,
      required: function () {
        return this.bookingType === 'multi'
      },
    },
    checkOutDate: {
      type: Date,
      required: function () {
        return this.bookingType === 'multi'
      },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'declined', 'cancelled', 'completed'],
      default: 'pending',
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
    },
    attendees: {
      type: Number,
      default: 1,
      min: [1, 'At least 1 attendee required'],
    },
    eventType: {
      type: String,
      trim: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'mobile_money_mtn', 'mobile_money_airtel', 'card'],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'cancelled'],
      default: 'pending',
    },
    paymentReference: {
      type: String,
      trim: true,
    },
    paymentTransactionId: {
      type: String,
      trim: true,
    },
    paymentProvider: {
      type: String,
      enum: ['MTN', 'Airtel', 'Card', 'Cash'],
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

// Ensure end time is after start time for single day bookings
bookingSchema.pre('validate', function (next) {
  if (this.bookingType === 'single' && this.startTime >= this.endTime) {
    this.invalidate('endTime', 'End time must be after start time')
  }

  // For multi-day bookings, ensure check-out is after check-in
  if (this.bookingType === 'multi' && this.checkInDate >= this.checkOutDate) {
    this.invalidate('checkOutDate', 'Check-out date must be after check-in date')
  }

  next()
})

// Index for querying bookings by date
bookingSchema.index({ eventDate: 1, space: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking
