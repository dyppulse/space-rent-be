import Booking from "../models/Booking.js"
import Space from "../models/Space.js"
import { StatusCodes } from "http-status-codes"
import { BadRequestError, NotFoundError, UnauthorizedError } from "../errors/index.js"
import mongoose from "mongoose"
import { sendBookingConfirmationEmail } from "../utils/emailService.js"

// Create a new booking (public endpoint)
export const createBooking = async (req, res) => {
  const {
    spaceId,
    clientName,
    clientEmail,
    clientPhone,
    eventDate,
    startTime,
    endTime,
    eventType,
    attendees,
    specialRequests,
  } = req.body

  if (!spaceId || !clientName || !clientEmail || !clientPhone || !eventDate || !startTime || !endTime) {
    throw new BadRequestError("Please provide all required fields")
  }

  // Check if space exists and is active
  const space = await Space.findOne({ _id: spaceId, isActive: true })

  if (!space) {
    throw new NotFoundError(`No space found with id ${spaceId}`)
  }

  // Check if the space is already booked for the requested time
  const conflictingBooking = await Booking.findOne({
    space: spaceId,
    eventDate: new Date(eventDate),
    $or: [
      {
        startTime: { $lt: new Date(endTime) },
        endTime: { $gt: new Date(startTime) },
      },
    ],
    status: { $ne: "cancelled" },
  })

  if (conflictingBooking) {
    throw new BadRequestError("The space is already booked for this time")
  }

  // Calculate total price based on duration and space price
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationHours = (end - start) / (1000 * 60 * 60)

  let totalPrice
  if (space.price.unit === "hour") {
    totalPrice = space.price.amount * durationHours
  } else if (space.price.unit === "day") {
    const durationDays = Math.ceil(durationHours / 24)
    totalPrice = space.price.amount * durationDays
  } else {
    // For 'event' pricing, use the flat rate
    totalPrice = space.price.amount
  }

  // Create the booking
  const booking = await Booking.create({
    space: spaceId,
    clientName,
    clientEmail,
    clientPhone,
    eventDate: new Date(eventDate),
    startTime: new Date(startTime),
    endTime: new Date(endTime),
    eventType,
    attendees,
    specialRequests,
    totalPrice,
    status: "pending",
  })

  // Optional: Send confirmation email
  try {
    await sendBookingConfirmationEmail({
      to: clientEmail,
      spaceName: space.name,
      bookingId: booking._id,
      eventDate,
      startTime,
      endTime,
      totalPrice,
    })
  } catch (error) {
    console.error("Failed to send confirmation email:", error)
    // Continue with the booking process even if email fails
  }

  res.status(StatusCodes.CREATED).json({ booking })
}

// Get all bookings for a space owner
export const getOwnerBookings = async (req, res) => {
  // Find all spaces owned by the user
  const userSpaces = await Space.find({ owner: req.user.userId })

  if (userSpaces.length === 0) {
    return res.status(StatusCodes.OK).json({ bookings: [], count: 0 })
  }

  const spaceIds = userSpaces.map((space) => space._id)

  // Query parameters
  const { status, startDate, endDate, sort } = req.query

  const queryObject = { space: { $in: spaceIds } }

  // Filter by status
  if (status && ["pending", "confirmed", "cancelled"].includes(status)) {
    queryObject.status = status
  }

  // Filter by date range
  if (startDate || endDate) {
    queryObject.eventDate = {}

    if (startDate) {
      queryObject.eventDate.$gte = new Date(startDate)
    }

    if (endDate) {
      if (queryObject.eventDate.$gte) {
        queryObject.eventDate.$lte = new Date(endDate)
      } else {
        queryObject.eventDate = { $lte: new Date(endDate) }
      }
    }
  }

  // Sorting
  let sortOptions = { eventDate: 1 } // Default sort by event date (ascending)

  if (sort === "latest") {
    sortOptions = { createdAt: -1 }
  } else if (sort === "oldest") {
    sortOptions = { createdAt: 1 }
  }

  // Pagination
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit

  const bookings = await Booking.find(queryObject).sort(sortOptions).skip(skip).limit(limit).populate({
    path: "space",
    select: "name location images price",
  })

  const totalBookings = await Booking.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalBookings / limit)

  res.status(StatusCodes.OK).json({
    bookings,
    totalBookings,
    numOfPages,
    currentPage: page,
  })
}

// Get a single booking by ID
export const getBooking = async (req, res) => {
  const { id: bookingId } = req.params

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new BadRequestError("Invalid booking ID")
  }

  const booking = await Booking.findById(bookingId).populate({
    path: "space",
    select: "name location images price owner",
  })

  if (!booking) {
    throw new NotFoundError(`No booking found with id ${bookingId}`)
  }

  // Check if the user is the owner of the space
  if (booking.space.owner.toString() !== req.user.userId) {
    throw new UnauthorizedError("Not authorized to view this booking")
  }

  res.status(StatusCodes.OK).json({ booking })
}

// Update booking status (confirm or cancel)
export const updateBookingStatus = async (req, res) => {
  const { id: bookingId } = req.params
  const { status } = req.body

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    throw new BadRequestError("Invalid booking ID")
  }

  if (!status || !["confirmed", "cancelled"].includes(status)) {
    throw new BadRequestError("Please provide a valid status (confirmed or cancelled)")
  }

  const booking = await Booking.findById(bookingId).populate({
    path: "space",
    select: "owner",
  })

  if (!booking) {
    throw new NotFoundError(`No booking found with id ${bookingId}`)
  }

  // Check if the user is the owner of the space
  if (booking.space.owner.toString() !== req.user.userId) {
    throw new UnauthorizedError("Not authorized to update this booking")
  }

  booking.status = status
  await booking.save()

  // Optional: Send status update email to client
  try {
    // Implementation of email notification would go here
  } catch (error) {
    console.error("Failed to send status update email:", error)
  }

  res.status(StatusCodes.OK).json({ booking })
}

// Get booking statistics for a space owner
export const getBookingStats = async (req, res) => {
  // Find all spaces owned by the user
  const userSpaces = await Space.find({ owner: req.user.userId })

  if (userSpaces.length === 0) {
    return res.status(StatusCodes.OK).json({
      totalBookings: 0,
      pendingBookings: 0,
      confirmedBookings: 0,
      cancelledBookings: 0,
      upcomingBookings: 0,
      totalRevenue: 0,
    })
  }

  const spaceIds = userSpaces.map((space) => space._id)

  // Get counts by status
  const [totalBookings, pendingBookings, confirmedBookings, cancelledBookings] = await Promise.all([
    Booking.countDocuments({ space: { $in: spaceIds } }),
    Booking.countDocuments({ space: { $in: spaceIds }, status: "pending" }),
    Booking.countDocuments({ space: { $in: spaceIds }, status: "confirmed" }),
    Booking.countDocuments({ space: { $in: spaceIds }, status: "cancelled" }),
  ])

  // Get upcoming bookings (future events that are confirmed)
  const upcomingBookings = await Booking.countDocuments({
    space: { $in: spaceIds },
    status: "confirmed",
    eventDate: { $gte: new Date() },
  })

  // Calculate total revenue from confirmed bookings
  const revenueResult = await Booking.aggregate([
    {
      $match: {
        space: { $in: spaceIds },
        status: "confirmed",
      },
    },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: "$totalPrice" },
      },
    },
  ])

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0

  res.status(StatusCodes.OK).json({
    totalBookings,
    pendingBookings,
    confirmedBookings,
    cancelledBookings,
    upcomingBookings,
    totalRevenue,
  })
}
