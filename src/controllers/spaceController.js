import Space from '../models/Space.js'
import { StatusCodes } from 'http-status-codes'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/index.js'
import mongoose from 'mongoose'

// Create a new space listing
export const createSpace = async (req, res) => {
  req.body.owner = req.user.userId

  const space = await Space.create(req.body)

  res.status(StatusCodes.CREATED).json({ space })
}

// Get all spaces (public endpoint)
export const getAllSpaces = async (req, res) => {
  const { search, city, state, spaceType, minPrice, maxPrice, sort } = req.query

  const queryObject = { isActive: true }

  // Search functionality
  if (search) {
    queryObject.$text = { $search: search }
  }

  // Filter by location
  if (city) {
    queryObject['location.city'] = { $regex: city, $options: 'i' }
  }

  if (state) {
    queryObject['location.state'] = { $regex: state, $options: 'i' }
  }

  // Filter by space type
  if (spaceType) {
    queryObject.spaceType = spaceType
  }

  // Filter by price range
  if (minPrice || maxPrice) {
    queryObject.price = {}

    if (minPrice) {
      queryObject.price.amount = { $gte: Number(minPrice) }
    }

    if (maxPrice) {
      if (queryObject.price.amount) {
        queryObject.price.amount.$lte = Number(maxPrice)
      } else {
        queryObject.price.amount = { $lte: Number(maxPrice) }
      }
    }
  }

  // Sorting
  let sortOptions = { createdAt: -1 } // Default sort by newest

  if (sort === 'price-low') {
    sortOptions = { 'price.amount': 1 }
  } else if (sort === 'price-high') {
    sortOptions = { 'price.amount': -1 }
  } else if (sort === 'name-a-z') {
    sortOptions = { name: 1 }
  } else if (sort === 'name-z-a') {
    sortOptions = { name: -1 }
  }

  // Pagination
  const page = Number(req.query.page) || 1
  const limit = Number(req.query.limit) || 10
  const skip = (page - 1) * limit

  const spaces = await Space.find(queryObject).sort(sortOptions).skip(skip).limit(limit)

  const totalSpaces = await Space.countDocuments(queryObject)
  const numOfPages = Math.ceil(totalSpaces / limit)

  res.status(StatusCodes.OK).json({
    spaces,
    totalSpaces,
    numOfPages,
    currentPage: page,
  })
}

// Get a single space by ID (public endpoint)
export const getSpace = async (req, res) => {
  const { id: spaceId } = req.params

  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    const error = new BadRequestError('Invalid space ID')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  const space = await Space.findOne({ _id: spaceId, isActive: true })

  if (!space) {
    const error = new NotFoundError(`No space found with id ${spaceId}`)
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  res.status(StatusCodes.OK).json({ space })
}

// Get spaces owned by the current user
export const getMySpaces = async (req, res) => {
  const spaces = await Space.find({ owner: req.user.userId }).sort('-createdAt')

  res.status(StatusCodes.OK).json({
    spaces,
    count: spaces.length,
  })
}

// Update a space
export const updateSpace = async (req, res) => {
  const { id: spaceId } = req.params

  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    const error = new BadRequestError('Invalid space ID')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Find the space first to check ownership
  const space = await Space.findById(spaceId)

  if (!space) {
    const error = new NotFoundError(`No space found with id ${spaceId}`)
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Check if the user is the owner of the space
  if (space.owner.toString() !== req.user.userId) {
    const error = new UnauthorizedError('Not authorized to update this space')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Update the space
  const updatedSpace = await Space.findByIdAndUpdate(spaceId, req.body, {
    new: true,
    runValidators: true,
  })

  res.status(StatusCodes.OK).json({ space: updatedSpace })
}

// Delete a space (soft delete by setting isActive to false)
export const deleteSpace = async (req, res) => {
  const { id: spaceId } = req.params

  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    const error = new BadRequestError('Invalid space ID')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Find the space first to check ownership
  const space = await Space.findById(spaceId)

  if (!space) {
    const error = new NotFoundError(`No space found with id ${spaceId}`)
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Check if the user is the owner of the space
  if (space.owner.toString() !== req.user.userId) {
    const error = new UnauthorizedError('Not authorized to delete this space')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Soft delete by setting isActive to false
  await Space.findByIdAndUpdate(spaceId, { isActive: false }, { new: true })

  res.status(StatusCodes.OK).json({ message: 'Space removed successfully' })
}

// Add images to a space
export const addSpaceImages = async (req, res) => {
  const { id: spaceId } = req.params
  const { images } = req.body

  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    const error = new BadRequestError('Invalid space ID')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  if (!images || !Array.isArray(images)) {
    const error = new BadRequestError('Please provide an array of image URLs')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Find the space first to check ownership
  const space = await Space.findById(spaceId)

  if (!space) {
    const error = new NotFoundError(`No space found with id ${spaceId}`)
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Check if the user is the owner of the space
  if (space.owner.toString() !== req.user.userId) {
    const error = new UnauthorizedError('Not authorized to update this space')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Add new images to the existing ones
  const updatedSpace = await Space.findByIdAndUpdate(
    spaceId,
    { $push: { images: { $each: images } } },
    { new: true, runValidators: true }
  )

  res.status(StatusCodes.OK).json({ space: updatedSpace })
}

// Remove an image from a space
export const removeSpaceImage = async (req, res) => {
  const { id: spaceId } = req.params
  const { imageUrl } = req.body

  if (!mongoose.Types.ObjectId.isValid(spaceId)) {
    const error = new BadRequestError('Invalid space ID')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  if (!imageUrl) {
    const error = new BadRequestError('Please provide the image URL to remove')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Find the space first to check ownership
  const space = await Space.findById(spaceId)

  if (!space) {
    const error = new NotFoundError(`No space found with id ${spaceId}`)
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Check if the user is the owner of the space
  if (space.owner.toString() !== req.user.userId) {
    const error = new UnauthorizedError('Not authorized to update this space')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  // Remove the image from the array
  const updatedSpace = await Space.findByIdAndUpdate(
    spaceId,
    { $pull: { images: imageUrl } },
    { new: true }
  )

  res.status(StatusCodes.OK).json({ space: updatedSpace })
}
