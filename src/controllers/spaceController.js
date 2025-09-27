import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { BadRequestError, NotFoundError, UnauthorizedError } from '../errors/index.js'
import Space from '../models/Space.js'
import SpaceType from '../models/SpaceType.js'
import {
  uploadImagesToCloudinary,
  deleteFromCloudinary,
  deleteMultipleFromCloudinary,
} from '../utils/uploadImagesToCloudinary.js'

// Create a new space listing
export const createSpace = async (req, res, next) => {
  try {
    // Upload images if they exist
    let images = []
    if (req.files && req.files.length > 0) {
      images = await uploadImagesToCloudinary(req.files)
    }

    // Attach image data to space
    const spaceData = { ...req.body, owner: req.user.userId, images }

    // Handle geospatial point - if coordinates are provided, create a proper Point
    if (spaceData.location && spaceData.location.coordinates) {
      const { lat, lng } = spaceData.location.coordinates
      if (lat && lng) {
        spaceData.location.point = {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB expects [longitude, latitude]
        }
      }
      // Remove the legacy coordinates field
      delete spaceData.location.coordinates
    }

    // Handle spaceType - if it's a string ID, validate it exists
    if (spaceData.spaceType && typeof spaceData.spaceType === 'string') {
      // Check if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(spaceData.spaceType)) {
        const spaceType = await SpaceType.findById(spaceData.spaceType)
        if (spaceType && spaceType.isActive) {
          spaceData.spaceTypeName = spaceType.name
        } else {
          throw new BadRequestError('Invalid or inactive space type')
        }
      } else {
        // If it's not a valid ObjectId, treat it as a name and try to find by name
        const spaceType = await SpaceType.findOne({
          name: { $regex: new RegExp(`^${spaceData.spaceType}$`, 'i') },
          isActive: true,
        })

        if (spaceType) {
          spaceData.spaceType = spaceType._id
          spaceData.spaceTypeName = spaceType.name
        } else {
          throw new BadRequestError('Space type not found')
        }
      }
    }

    const space = await Space.create(spaceData)

    res.status(StatusCodes.CREATED).json({ space })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

// Get all spaces (public endpoint)
export const getAllSpaces = async (req, res, next) => {
  try {
    const {
      search,
      city,
      state,
      district,
      county,
      subCounty,
      parish,
      village,
      spaceType,
      minPrice,
      maxPrice,
      sort,
      capacity,
      nearLng,
      nearLat,
      nearKm,
    } = req.query

    const queryObject = { isActive: true }

    // Search functionality - Enhanced search across multiple fields
    if (search) {
      // Create multiple search patterns for better matching
      const exactSearch = search.trim()
      const words = exactSearch.split(' ').filter((word) => word.length > 0)

      // Create an OR query for multiple searchable fields
      queryObject.$or = [
        // Exact match (highest priority)
        { name: { $regex: `^${exactSearch}$`, $options: 'i' } },
        { spaceType: { $regex: `^${exactSearch}$`, $options: 'i' } },

        // Contains the full search term
        { name: { $regex: exactSearch, $options: 'i' } },
        { spaceType: { $regex: exactSearch, $options: 'i' } },
        { 'location.district': { $regex: exactSearch, $options: 'i' } },
        { 'location.county': { $regex: exactSearch, $options: 'i' } },
        { 'location.subCounty': { $regex: exactSearch, $options: 'i' } },
        { 'location.village': { $regex: exactSearch, $options: 'i' } },
        { 'location.city': { $regex: exactSearch, $options: 'i' } },
        { 'location.state': { $regex: exactSearch, $options: 'i' } },
        { 'location.address': { $regex: exactSearch, $options: 'i' } },
        { description: { $regex: exactSearch, $options: 'i' } },
        { amenities: { $regex: exactSearch, $options: 'i' } },

        // Partial word matches (for multi-word searches like "Miranda Keller")
        ...words.map((word) => ({ name: { $regex: word, $options: 'i' } })),
        ...words.map((word) => ({ spaceType: { $regex: word, $options: 'i' } })),
        ...words.map((word) => ({ 'location.city': { $regex: word, $options: 'i' } })),
        ...words.map((word) => ({ 'location.district': { $regex: word, $options: 'i' } })),
      ]
    }

    // Filter by location (legacy + Uganda hierarchy)
    if (city) {
      queryObject['location.city'] = { $regex: city, $options: 'i' }
    }

    if (state) {
      queryObject['location.state'] = { $regex: state, $options: 'i' }
    }

    if (district) queryObject['location.district'] = { $regex: district, $options: 'i' }
    if (county) queryObject['location.county'] = { $regex: county, $options: 'i' }
    if (subCounty) queryObject['location.subCounty'] = { $regex: subCounty, $options: 'i' }
    if (parish) queryObject['location.parish'] = { $regex: parish, $options: 'i' }
    if (village) queryObject['location.village'] = { $regex: village, $options: 'i' }

    // Filter by space type
    if (spaceType) {
      queryObject.spaceType = spaceType
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      queryObject['price.amount'] = {}

      if (minPrice) {
        queryObject['price.amount'].$gte = Number(minPrice)
      }

      if (maxPrice) {
        queryObject['price.amount'].$lte = Number(maxPrice)
      }
    }

    // Filter by capacity
    if (capacity && capacity !== 'any') {
      if (capacity === 'small') {
        queryObject.capacity = { $lte: 20 }
      } else if (capacity === 'medium') {
        queryObject.capacity = { $gte: 21, $lte: 50 }
      } else if (capacity === 'large') {
        queryObject.capacity = { $gte: 51, $lte: 100 }
      } else if (capacity === 'xl') {
        queryObject.capacity = { $gt: 100 }
      }
    }

    // Sorting
    let sortOptions = { createdAt: -1 } // Default sort by newest

    if (sort === 'price-low') {
      sortOptions = { 'price.amount': 1 }
    } else if (sort === 'price-high') {
      sortOptions = { 'price.amount': -1 }
    } else if (sort === 'rating') {
      sortOptions = { rating: -1 } // Sort by rating (highest first)
    } else if (sort === 'newest') {
      sortOptions = { createdAt: -1 } // Sort by newest
    } else if (sort === 'recommended') {
      // For recommended, we could implement a scoring algorithm
      // For now, default to newest
      sortOptions = { createdAt: -1 }
    } else if (sort === 'name-a-z') {
      sortOptions = { name: 1 }
    } else if (sort === 'name-z-a') {
      sortOptions = { name: -1 }
    }

    // Pagination
    const page = Number(req.query.page) || 1
    const limit = Number(req.query.limit) || 10
    const skip = (page - 1) * limit

    // Optional geospatial filter
    if (nearLng && nearLat) {
      const maxDistanceMeters = Number(nearKm || 10) * 1000
      queryObject['location.point'] = {
        $near: {
          $geometry: { type: 'Point', coordinates: [Number(nearLng), Number(nearLat)] },
          $maxDistance: maxDistanceMeters,
        },
      }
    }

    const spaces = await Space.find(queryObject)
      .populate('spaceType', 'name description icon')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)

    const totalSpaces = await Space.countDocuments(queryObject)
    const numOfPages = Math.ceil(totalSpaces / limit)

    res.status(StatusCodes.OK).json({
      spaces,
      totalSpaces,
      numOfPages,
      currentPage: page,
    })
  } catch (err) {
    next(err)
  }
}

// Get a single space by ID (public endpoint)
export const getSpace = async (req, res, next) => {
  try {
    const { id: spaceId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      const error = new BadRequestError('Invalid space ID')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const space = await Space.findOne({ _id: spaceId, isActive: true }).populate(
      'spaceType',
      'name description icon'
    )

    if (!space) {
      const error = new NotFoundError(`No space found with id ${spaceId}`)
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(StatusCodes.OK).json({ space })
  } catch (err) {
    next(err)
  }
}

// Get spaces owned by the current user
export const getMySpaces = async (req, res, next) => {
  try {
    const spaces = await Space.find({ owner: req.user.userId })
      .populate('spaceType', 'name description icon')
      .sort('-createdAt')

    res.status(StatusCodes.OK).json({
      spaces,
      count: spaces.length,
    })
  } catch (err) {
    next(err)
  }
}

// Update space
export const updateSpace = async (req, res, next) => {
  try {
    const { id: spaceId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: 'Invalid space ID' })
    }

    const space = await Space.findById(spaceId)
    if (!space) {
      return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Space not found' })
    }

    if (space.owner.toString() !== req.user.userId) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ success: false, message: 'Unauthorized' })
    }

    // Handle new image uploads
    let uploadedImages = []
    if (req.files && req.files.length > 0) {
      uploadedImages = await uploadImagesToCloudinary(req.files) // Returns array of image objects
    }

    // Handle image removals
    const removeImagesRaw = req.body.imagesToRemove
    const imagesToRemove = removeImagesRaw ? JSON.parse(removeImagesRaw) : []

    if (imagesToRemove.length > 0) {
      for (const imageUrl of imagesToRemove) {
        await deleteFromCloudinary(imageUrl) // Delete from Cloudinary
      }

      // Remove from MongoDB
      await Space.findByIdAndUpdate(spaceId, {
        $pull: { images: { url: { $in: imagesToRemove } } },
      })
    }

    // Handle geospatial point for updates
    const updateData = { ...req.body }
    if (updateData.location && updateData.location.coordinates) {
      const { lat, lng } = updateData.location.coordinates
      if (lat && lng) {
        updateData.location.point = {
          type: 'Point',
          coordinates: [lng, lat], // MongoDB expects [longitude, latitude]
        }
      }
      // Remove the legacy coordinates field
      delete updateData.location.coordinates
    }

    // Merge image additions
    const updatedSpace = await Space.findByIdAndUpdate(
      spaceId,
      {
        ...updateData,
        $push: { images: { $each: uploadedImages } },
      },
      {
        new: true,
        runValidators: true,
      }
    )

    res.status(StatusCodes.OK).json({ space: updatedSpace })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

// Delete a space (soft delete by setting isActive to false)
export const deleteSpace = async (req, res, next) => {
  try {
    const { id: spaceId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceId)) {
      const error = new BadRequestError('Invalid space ID')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Find the space to validate ownership and fetch images
    const space = await Space.findById(spaceId)

    if (!space) {
      const error = new NotFoundError(`No space found with id ${spaceId}`)
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Check if the user is the owner
    if (space.owner.toString() !== req.user.userId) {
      const error = new UnauthorizedError('Not authorized to delete this space')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Delete all associated images from Cloudinary
    const publicIds = (space.images || []).map((img) => img.public_id).filter(Boolean)

    if (publicIds.length > 0) {
      await deleteMultipleFromCloudinary(publicIds)
    }

    // Hard delete from MongoDB
    await Space.findByIdAndDelete(spaceId)

    res.status(StatusCodes.OK).json({ message: 'Space deleted successfully' })
  } catch (err) {
    console.error(err)
    next(err)
  }
}

// Add images to a space
export const addSpaceImages = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err)
  }
}

// Remove an image from a space
export const removeSpaceImage = async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err)
  }
}
