import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/index.js'
import Booking from '../models/Booking.js'
import Space from '../models/Space.js'
import { sendBookingConfirmationEmail } from '../utils/emailService.js'

// Create a new booking (public endpoint)
export const createBooking = async (req, res, next) => {
  const {
    spaceId,
    clientName,
    clientEmail,
    clientPhone,
    bookingType,
    eventDate,
    startTime,
    endTime,
    checkInDate,
    checkOutDate,
    guests,
    eventType,
    specialRequests,
    paymentMethod,
  } = req.body

  try {
    // Validate required fields based on booking type
    if (!spaceId || !clientName || !clientEmail || !clientPhone) {
      const error = new BadRequestError('Please provide all required fields')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Validate booking type specific fields
    if (bookingType === 'single') {
      if (!eventDate) {
        const error = new BadRequestError('Please provide event date for single day booking')
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }
    } else if (bookingType === 'multi') {
      if (!checkInDate || !checkOutDate) {
        const error = new BadRequestError(
          'Please provide check-in and check-out dates for multi-day booking'
        )
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }
    } else {
      const error = new BadRequestError('Please specify booking type (single or multi)')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Check if space exists and is active
    const space = await Space.findOne({ _id: spaceId, isActive: true })

    if (!space) {
      const error = new NotFoundError(`No space found with id ${spaceId}`)
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Check if the space is already booked for the requested time
    // Only check for conflicts if we have an eventDate
    if (eventDate && bookingType === 'single') {
      const queryDate = new Date(eventDate)
      const conflictQuery = {
        space: spaceId,
        eventDate: queryDate,
        status: { $nin: ['cancelled', 'declined'] },
      }

      // If we have start and end times, check for time overlap
      // Otherwise, just check for same date (full day booking)
      if (startTime && endTime) {
        conflictQuery.$or = [
          {
            startTime: { $lt: new Date(endTime) },
            endTime: { $gt: new Date(startTime) },
          },
        ]
      }

      const conflictingBooking = await Booking.findOne(conflictQuery)

      if (conflictingBooking) {
        const error = new BadRequestError('The space is already booked for this time')
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        })
      }
    }

    // Calculate total price based on booking type
    let totalPrice
    let bookingData = {
      space: spaceId,
      clientName,
      clientEmail,
      clientPhone,
      bookingType,
      attendees: guests || 1,
      eventType,
      specialRequests,
      totalPrice,
      status: 'pending',
      paymentMethod: paymentMethod || 'cash',
    }

    if (bookingType === 'single') {
      // Single day booking
      bookingData.eventDate = new Date(eventDate)

      if (space.price.unit === 'hour') {
        // For hourly pricing, start and end times are required
        if (!startTime || !endTime) {
          const error = new BadRequestError(
            'Start time and end time are required for hourly priced spaces'
          )
          return res.status(error.statusCode).json({
            success: false,
            message: error.message,
          })
        }
        const start = new Date(startTime)
        const end = new Date(endTime)
        const durationHours = (end - start) / (1000 * 60 * 60)
        totalPrice = space.price.amount * durationHours
        bookingData.startTime = start
        bookingData.endTime = end
      } else if (space.price.unit === 'day') {
        // For daily pricing, use full day - start/end times are optional
        totalPrice = space.price.amount
        // Set default times if not provided (full day: midnight to midnight)
        const eventDateObj = new Date(eventDate)
        bookingData.startTime = startTime
          ? new Date(startTime)
          : new Date(eventDateObj.setHours(0, 0, 0, 0))
        const endDateObj = new Date(eventDate)
        bookingData.endTime = endTime
          ? new Date(endTime)
          : new Date(endDateObj.setHours(23, 59, 59, 999))
      } else {
        // Event pricing
        totalPrice = space.price.amount
        if (startTime && endTime) {
          bookingData.startTime = new Date(startTime)
          bookingData.endTime = new Date(endTime)
        }
      }
    } else if (bookingType === 'multi') {
      // Multi-day booking
      const checkIn = new Date(checkInDate)
      const checkOut = new Date(checkOutDate)
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))

      if (space.price.unit === 'day') {
        totalPrice = space.price.amount * nights
      } else if (space.price.unit === 'hour') {
        // For hourly spaces, charge for 24 hours per night
        totalPrice = space.price.amount * 24 * nights
      } else {
        totalPrice = space.price.amount * nights
      }

      bookingData.checkInDate = checkIn
      bookingData.checkOutDate = checkOut
      bookingData.eventDate = checkIn // Use check-in as event date for compatibility
      bookingData.startTime = checkIn
      bookingData.endTime = checkOut
    }

    bookingData.totalPrice = totalPrice

    // Add user to booking data
    bookingData.user = req.user.userId

    // Create the booking
    const booking = await Booking.create(bookingData)

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
      console.error('Failed to send confirmation email:', error)
      // Continue with the booking process even if email fails
    }

    res.status(StatusCodes.CREATED).json({ booking })
  } catch (err) {
    next(err)
  }
}

// Get all bookings for a regular user (client)
export const getUserBookings = async (req, res, next) => {
  try {
    const userId = req.user.userId

    // Query parameters
    const { status, startDate, endDate, sort } = req.query

    const queryObject = { user: userId }

    // Filter by status
    if (status && ['pending', 'confirmed', 'declined', 'cancelled', 'completed'].includes(status)) {
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

    if (sort === 'latest') {
      sortOptions = { createdAt: -1 }
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    // Pagination
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const bookings = await Booking.find(queryObject)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'space',
        select: 'name location images price owner',
      })

    const totalBookings = await Booking.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalBookings / limit)

    res.status(StatusCodes.OK).json({
      bookings,
      totalBookings,
      numOfPages,
      currentPage: page,
    })
  } catch (err) {
    next(err)
  }
}

// Get all bookings for a space owner
export const getOwnerBookings = async (req, res, next) => {
  try {
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
    if (status && ['pending', 'confirmed', 'declined', 'cancelled', 'completed'].includes(status)) {
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

    if (sort === 'latest') {
      sortOptions = { createdAt: -1 }
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 }
    }

    // Pagination
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    const bookings = await Booking.find(queryObject)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'space',
        select: 'name location images price',
      })

    const totalBookings = await Booking.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalBookings / limit)

    res.status(StatusCodes.OK).json({
      bookings,
      totalBookings,
      numOfPages,
      currentPage: page,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single booking by ID
export const getBooking = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      const error = new BadRequestError('Invalid booking ID')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'space',
      select: 'name location images price owner',
    })

    if (!booking) {
      const error = new NotFoundError(`No booking found with id ${bookingId}`)
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Check if the user is the owner of the space
    if (booking.space.owner.toString() !== req.user.userId) {
      const error = new UnauthorizedError('Not authorized to view this booking')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(StatusCodes.OK).json({ booking })
  } catch (err) {
    next(err)
  }
}

// Update booking status (confirm, decline, or cancel)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const { id: bookingId } = req.params
    const { status, reason } = req.body

    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      const error = new BadRequestError('Invalid booking ID')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    if (!status || !['confirmed', 'declined', 'cancelled', 'completed'].includes(status)) {
      const error = new BadRequestError(
        'Please provide a valid status (confirmed, declined, cancelled, or completed)'
      )
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const booking = await Booking.findById(bookingId).populate({
      path: 'space',
      select: 'owner name',
    })

    if (!booking) {
      const error = new NotFoundError(`No booking found with id ${bookingId}`)
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Check if the user is the owner of the space
    if (booking.space.owner.toString() !== req.user.userId) {
      const error = new UnauthorizedError('Not authorized to update this booking')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Update status and reason if provided
    booking.status = status
    if (reason) {
      booking.cancellationReason = reason
    }
    await booking.save()

    // Populate space details for the response
    await booking.populate({
      path: 'space',
      select: 'name location images price',
    })

    // Optional: Send status update email to client
    try {
      // Implementation of email notification would go here
    } catch (error) {
      console.error('Failed to send status update email:', error)
    }

    res.status(StatusCodes.OK).json({ booking })
  } catch (err) {
    next(err)
  }
}

// Get booking statistics for a space owner
export const getBookingStats = async (req, res, next) => {
  try {
    // Find all spaces owned by the user
    const userSpaces = await Space.find({ owner: req.user.userId })

    if (userSpaces.length === 0) {
      return res.status(StatusCodes.OK).json({
        totalBookings: 0,
        pendingBookings: 0,
        confirmedBookings: 0,
        declinedBookings: 0,
        cancelledBookings: 0,
        completedBookings: 0,
        upcomingBookings: 0,
        totalRevenue: 0,
      })
    }

    const spaceIds = userSpaces.map((space) => space._id)

    // Get counts by status
    const [
      totalBookings,
      pendingBookings,
      confirmedBookings,
      declinedBookings,
      cancelledBookings,
      completedBookings,
    ] = await Promise.all([
      Booking.countDocuments({ space: { $in: spaceIds } }),
      Booking.countDocuments({ space: { $in: spaceIds }, status: 'pending' }),
      Booking.countDocuments({ space: { $in: spaceIds }, status: 'confirmed' }),
      Booking.countDocuments({ space: { $in: spaceIds }, status: 'declined' }),
      Booking.countDocuments({ space: { $in: spaceIds }, status: 'cancelled' }),
      Booking.countDocuments({ space: { $in: spaceIds }, status: 'completed' }),
    ])

    // Get upcoming bookings (future events that are confirmed)
    const upcomingBookings = await Booking.countDocuments({
      space: { $in: spaceIds },
      status: 'confirmed',
      eventDate: { $gte: new Date() },
    })

    // Calculate total revenue from confirmed and completed bookings
    const revenueResult = await Booking.aggregate([
      {
        $match: {
          space: { $in: spaceIds },
          status: { $in: ['confirmed', 'completed'] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
        },
      },
    ])

    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0

    res.status(StatusCodes.OK).json({
      totalBookings,
      pendingBookings,
      confirmedBookings,
      declinedBookings,
      cancelledBookings,
      completedBookings,
      upcomingBookings,
      totalRevenue,
    })
  } catch (err) {
    next(err)
  }
}
