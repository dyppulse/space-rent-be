import { StatusCodes } from 'http-status-codes'
import mongoose from 'mongoose'

import { BadRequestError, NotFoundError } from '../errors/index.js'
import SpaceType from '../models/SpaceType.js'

// Get all space types (public endpoint)
export const getAllSpaceTypes = async (req, res, next) => {
  try {
    const { active } = req.query

    const query = {}
    if (active === 'true') {
      query.isActive = true
    }

    const spaceTypes = await SpaceType.find(query).sort({ name: 1 })

    res.status(StatusCodes.OK).json({
      spaceTypes,
      count: spaceTypes.length,
    })
  } catch (err) {
    next(err)
  }
}

// Get single space type by ID
export const getSpaceType = async (req, res, next) => {
  try {
    const { id: spaceTypeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceTypeId)) {
      const error = new BadRequestError('Invalid space type ID')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const spaceType = await SpaceType.findById(spaceTypeId)

    if (!spaceType) {
      const error = new NotFoundError(`No space type found with id ${spaceTypeId}`)
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(StatusCodes.OK).json({ spaceType })
  } catch (err) {
    next(err)
  }
}

// Create new space type (admin only)
export const createSpaceType = async (req, res, next) => {
  try {
    const spaceTypeData = {
      ...req.body,
      createdBy: req.user.userId,
    }

    const spaceType = await SpaceType.create(spaceTypeData)

    res.status(StatusCodes.CREATED).json({ spaceType })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

// Update space type (admin only)
export const updateSpaceType = async (req, res, next) => {
  try {
    const { id: spaceTypeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceTypeId)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ success: false, message: 'Invalid space type ID' })
    }

    const spaceType = await SpaceType.findById(spaceTypeId)
    if (!spaceType) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Space type not found',
      })
    }

    const updatedSpaceType = await SpaceType.findByIdAndUpdate(spaceTypeId, req.body, {
      new: true,
      runValidators: true,
    })

    res.status(StatusCodes.OK).json({ spaceType: updatedSpaceType })
  } catch (error) {
    console.error(error)
    next(error)
  }
}

// Delete space type (admin only)
export const deleteSpaceType = async (req, res, next) => {
  try {
    const { id: spaceTypeId } = req.params

    if (!mongoose.Types.ObjectId.isValid(spaceTypeId)) {
      const error = new BadRequestError('Invalid space type ID')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const spaceType = await SpaceType.findById(spaceTypeId)

    if (!spaceType) {
      const error = new NotFoundError(`No space type found with id ${spaceTypeId}`)
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Soft delete by setting isActive to false instead of hard delete
    // This prevents issues with existing spaces that reference this type
    spaceType.isActive = false
    await spaceType.save()

    res.status(StatusCodes.OK).json({
      message: 'Space type deactivated successfully',
      spaceType,
    })
  } catch (err) {
    console.error(err)
    next(err)
  }
}
