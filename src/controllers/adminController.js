import { StatusCodes } from 'http-status-codes'

import { BadRequestError, NotFoundError } from '../errors/index.js'
import Booking from '../models/Booking.js'
import LocationRef from '../models/LocationRef.js'
import Space from '../models/Space.js'
import Taxonomy from '../models/Taxonomy.js'
import User from '../models/User.js'

// Dashboard Overview
export const getDashboardStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalSpaces,
      totalBookings,
      pendingBookings,
      confirmedBookings,
      cancelledBookings,
    ] = await Promise.all([
      User.countDocuments(),
      Space.countDocuments({ isActive: true }),
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ])

    const recentSpaces = await Space.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name owner createdAt')

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('space', 'name')
      .populate('client', 'name email')

    res.status(StatusCodes.OK).json({
      stats: {
        totalUsers,
        totalSpaces,
        totalBookings,
        pendingBookings,
        confirmedBookings,
        cancelledBookings,
      },
      recentSpaces,
      recentBookings,
    })
  } catch (err) {
    next(err)
  }
}

// Global Search
export const globalSearch = async (req, res, next) => {
  try {
    const { query } = req.query
    if (!query || query.trim().length < 2) {
      throw new BadRequestError('Search query must be at least 2 characters')
    }

    const searchRegex = { $regex: query, $options: 'i' }

    const [users, spaces, bookings] = await Promise.all([
      User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }],
      })
        .select('name email phone role createdAt')
        .limit(10),
      Space.find({
        $or: [
          { name: searchRegex },
          { 'location.district': searchRegex },
          { 'location.county': searchRegex },
          { 'location.city': searchRegex },
        ],
      })
        .select('name location district county city isActive createdAt')
        .limit(10),
      Booking.find({
        $or: [{ 'client.name': searchRegex }, { 'client.email': searchRegex }],
      })
        .populate('space', 'name')
        .populate('client', 'name email')
        .limit(10),
    ])

    res.status(StatusCodes.OK).json({
      users,
      spaces,
      bookings,
    })
  } catch (err) {
    next(err)
  }
}

// Users Management
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query
    const query = {}

    if (role) query.role = role
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [users, total] = await Promise.all([
      User.find(query).skip(skip).limit(Number(limit)).sort({ createdAt: -1 }),
      User.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const { name, email, phone, password, role = 'owner' } = req.body

    if (!name || !email || !password) {
      throw new BadRequestError('Name, email, and password are required')
    }

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw new BadRequestError('User with this email already exists')
    }

    const user = await User.create({
      name,
      email,
      phone,
      password,
      role,
    })

    res.status(StatusCodes.CREATED).json({
      user,
    })
  } catch (err) {
    next(err)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, email, phone, role } = req.body

    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new BadRequestError('Email already in use')
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, email, phone, role },
      { new: true, runValidators: true }
    )

    res.status(StatusCodes.OK).json({
      user: updatedUser,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    const user = await User.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }

    if (user.role === 'superadmin') {
      throw new BadRequestError('Cannot delete superadmin users')
    }

    // Check if user has spaces or bookings
    const [spacesCount, bookingsCount] = await Promise.all([
      Space.countDocuments({ owner: id }),
      Booking.countDocuments({ client: id }),
    ])

    if (spacesCount > 0 || bookingsCount > 0) {
      throw new BadRequestError('Cannot delete user with existing spaces or bookings')
    }

    await User.findByIdAndDelete(id)

    res.status(StatusCodes.OK).json({
      message: 'User deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Spaces Management
export const getAllSpaces = async (req, res, next) => {
  try {
    const { owner, district, isActive, search, page = 1, limit = 20 } = req.query
    const query = {}

    if (owner) query.owner = owner
    if (district) query['location.district'] = { $regex: district, $options: 'i' }
    if (isActive !== undefined) query.isActive = isActive === 'true'
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.district': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [spaces, total] = await Promise.all([
      Space.find(query)
        .populate('owner', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Space.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      spaces,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const createSpace = async (req, res, next) => {
  try {
    const spaceData = req.body
    const space = await Space.create(spaceData)

    const populatedSpace = await Space.findById(space._id).populate('owner', 'name email')

    res.status(StatusCodes.CREATED).json({
      space: populatedSpace,
    })
  } catch (err) {
    next(err)
  }
}

export const updateSpace = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const space = await Space.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('owner', 'name email')

    if (!space) {
      throw new NotFoundError('Space not found')
    }

    res.status(StatusCodes.OK).json({
      space,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteSpace = async (req, res, next) => {
  try {
    const { id } = req.params

    const space = await Space.findById(id)
    if (!space) {
      throw new NotFoundError('Space not found')
    }

    // Check if space has active bookings
    const activeBookings = await Booking.countDocuments({
      space: id,
      status: { $in: ['pending', 'confirmed'] },
    })

    if (activeBookings > 0) {
      throw new BadRequestError('Cannot delete space with active bookings')
    }

    await Space.findByIdAndDelete(id)

    res.status(StatusCodes.OK).json({
      message: 'Space deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Bookings Management
export const getAllBookings = async (req, res, next) => {
  try {
    const { status, space, client, search, page = 1, limit = 20 } = req.query
    const query = {}

    if (status) query.status = status
    if (space) query.space = space
    if (client) query.client = client
    if (search) {
      query.$or = [
        { 'client.name': { $regex: search, $options: 'i' } },
        { 'client.email': { $regex: search, $options: 'i' } },
        { 'client.phone': { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('space', 'name location')
        .populate('client', 'name email phone')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      Booking.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const updateBooking = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const booking = await Booking.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate('space', 'name location')
      .populate('client', 'name email phone')

    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    res.status(StatusCodes.OK).json({
      booking,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteBooking = async (req, res, next) => {
  try {
    const { id } = req.params

    const booking = await Booking.findById(id)
    if (!booking) {
      throw new NotFoundError('Booking not found')
    }

    if (booking.status === 'confirmed') {
      throw new BadRequestError('Cannot delete confirmed bookings')
    }

    await Booking.findByIdAndDelete(id)

    res.status(StatusCodes.OK).json({
      message: 'Booking deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Locations Management
export const getAllLocations = async (req, res, next) => {
  try {
    const { level, parent, search, page = 1, limit = 50 } = req.query
    const query = {}

    if (level) query.level = level
    if (parent) query.parent = parent
    if (search) {
      query.name = { $regex: search, $options: 'i' }
    }

    const skip = (page - 1) * limit
    const [locations, total] = await Promise.all([
      LocationRef.find(query)
        .populate('parent', 'name level')
        .skip(skip)
        .limit(Number(limit))
        .sort({ name: 1 }),
      LocationRef.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      locations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const createLocation = async (req, res, next) => {
  try {
    const { level, name, parent } = req.body

    if (!level || !name) {
      throw new BadRequestError('Level and name are required')
    }

    const existingLocation = await LocationRef.findOne({ level, name })
    if (existingLocation) {
      throw new BadRequestError('Location with this name already exists at this level')
    }

    const location = await LocationRef.create({
      level,
      name,
      parent: parent || null,
    })

    const populatedLocation = await LocationRef.findById(location._id).populate(
      'parent',
      'name level'
    )

    res.status(StatusCodes.CREATED).json({
      location: populatedLocation,
    })
  } catch (err) {
    next(err)
  }
}

export const updateLocation = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const location = await LocationRef.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate('parent', 'name level')

    if (!location) {
      throw new NotFoundError('Location not found')
    }

    res.status(StatusCodes.OK).json({
      location,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params

    const location = await LocationRef.findById(id)
    if (!location) {
      throw new NotFoundError('Location not found')
    }

    // Check if location has children
    const hasChildren = await LocationRef.exists({ parent: id })
    if (hasChildren) {
      throw new BadRequestError('Cannot delete location with child locations')
    }

    // Check if location is used in spaces
    const usedInSpaces = await Space.exists({
      $or: [
        { 'location.district': location.name },
        { 'location.county': location.name },
        { 'location.subCounty': location.name },
        { 'location.parish': location.name },
        { 'location.village': location.name },
      ],
    })

    if (usedInSpaces) {
      throw new BadRequestError('Cannot delete location that is used in spaces')
    }

    await LocationRef.findByIdAndDelete(id)

    res.status(StatusCodes.OK).json({
      message: 'Location deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Taxonomies Management
export const getAllTaxonomies = async (req, res, next) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query
    const query = {}

    if (type) query.type = type
    if (search) {
      query.$or = [
        { key: { $regex: search, $options: 'i' } },
        { label: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit
    const [taxonomies, total] = await Promise.all([
      Taxonomy.find(query).skip(skip).limit(Number(limit)).sort({ sortOrder: 1, label: 1 }),
      Taxonomy.countDocuments(query),
    ])

    res.status(StatusCodes.OK).json({
      taxonomies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    next(err)
  }
}

export const createTaxonomy = async (req, res, next) => {
  try {
    const { type, key, label, sortOrder = 0 } = req.body

    if (!type || !key || !label) {
      throw new BadRequestError('Type, key, and label are required')
    }

    const existingTaxonomy = await Taxonomy.findOne({ key })
    if (existingTaxonomy) {
      throw new BadRequestError('Taxonomy with this key already exists')
    }

    const taxonomy = await Taxonomy.create({
      type,
      key,
      label,
      sortOrder,
    })

    res.status(StatusCodes.CREATED).json({
      taxonomy,
    })
  } catch (err) {
    next(err)
  }
}

export const updateTaxonomy = async (req, res, next) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const taxonomy = await Taxonomy.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })

    if (!taxonomy) {
      throw new NotFoundError('Taxonomy not found')
    }

    res.status(StatusCodes.OK).json({
      taxonomy,
    })
  } catch (err) {
    next(err)
  }
}

export const deleteTaxonomy = async (req, res, next) => {
  try {
    const { id } = req.params

    const taxonomy = await Taxonomy.findById(id)
    if (!taxonomy) {
      throw new NotFoundError('Taxonomy not found')
    }

    // Check if taxonomy is used in spaces
    const usedInSpaces = await Space.exists({
      $or: [{ spaceType: taxonomy.key }, { amenities: taxonomy.key }],
    })

    if (usedInSpaces) {
      throw new BadRequestError('Cannot delete taxonomy that is used in spaces')
    }

    await Taxonomy.findByIdAndDelete(id)

    res.status(StatusCodes.OK).json({
      message: 'Taxonomy deleted successfully',
    })
  } catch (err) {
    next(err)
  }
}

export const reorderTaxonomies = async (req, res, next) => {
  try {
    const { taxonomies } = req.body

    if (!Array.isArray(taxonomies)) {
      throw new BadRequestError('Taxonomies must be an array')
    }

    const updatePromises = taxonomies.map(({ id, sortOrder }) =>
      Taxonomy.findByIdAndUpdate(id, { sortOrder }, { new: true })
    )

    const updatedTaxonomies = await Promise.all(updatePromises)

    res.status(StatusCodes.OK).json({
      taxonomies: updatedTaxonomies,
    })
  } catch (err) {
    next(err)
  }
}
