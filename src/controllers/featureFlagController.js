import { BadRequestError, NotFoundError } from '../errors/index.js'
import FeatureFlag from '../models/FeatureFlag.js'

// Get all feature flags
export const getFeatureFlags = async (req, res, next) => {
  try {
    const featureFlags = await FeatureFlag.find({})
      .populate('createdBy', 'name email')
      .sort({ category: 1, name: 1 })

    res.status(200).json({
      success: true,
      data: featureFlags,
    })
  } catch (error) {
    next(error)
  }
}

// Get a single feature flag
export const getFeatureFlag = async (req, res, next) => {
  try {
    const { id } = req.params
    const featureFlag = await FeatureFlag.findById(id).populate('createdBy', 'name email')

    if (!featureFlag) {
      throw new NotFoundError('Feature flag not found')
    }

    res.status(200).json({
      success: true,
      data: featureFlag,
    })
  } catch (error) {
    next(error)
  }
}

// Create a new feature flag
export const createFeatureFlag = async (req, res, next) => {
  try {
    const { name, description, isEnabled, category, config } = req.body
    const createdBy = req.user.id

    // Check if feature flag with same name already exists
    const existingFlag = await FeatureFlag.findOne({ name })
    if (existingFlag) {
      throw new BadRequestError('Feature flag with this name already exists')
    }

    const featureFlag = await FeatureFlag.create({
      name,
      description,
      isEnabled,
      category,
      config,
      createdBy,
    })

    await featureFlag.populate('createdBy', 'name email')

    res.status(201).json({
      success: true,
      data: featureFlag,
    })
  } catch (error) {
    next(error)
  }
}

// Update a feature flag
export const updateFeatureFlag = async (req, res, next) => {
  try {
    const { id } = req.params
    const { name, description, isEnabled, category, config } = req.body

    const featureFlag = await FeatureFlag.findByIdAndUpdate(
      id,
      { name, description, isEnabled, category, config },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')

    if (!featureFlag) {
      throw new NotFoundError('Feature flag not found')
    }

    res.status(200).json({
      success: true,
      data: featureFlag,
    })
  } catch (error) {
    next(error)
  }
}

// Delete a feature flag
export const deleteFeatureFlag = async (req, res, next) => {
  try {
    const { id } = req.params
    const featureFlag = await FeatureFlag.findByIdAndDelete(id)

    if (!featureFlag) {
      throw new NotFoundError('Feature flag not found')
    }

    res.status(200).json({
      success: true,
      message: 'Feature flag deleted successfully',
    })
  } catch (error) {
    next(error)
  }
}

// Toggle a feature flag
export const toggleFeatureFlag = async (req, res, next) => {
  try {
    const { id } = req.params
    const featureFlag = await FeatureFlag.findById(id)

    if (!featureFlag) {
      throw new NotFoundError('Feature flag not found')
    }

    featureFlag.isEnabled = !featureFlag.isEnabled
    await featureFlag.save()

    await featureFlag.populate('createdBy', 'name email')

    res.status(200).json({
      success: true,
      data: featureFlag,
    })
  } catch (error) {
    next(error)
  }
}

// Get feature flags by category
export const getFeatureFlagsByCategory = async (req, res, next) => {
  try {
    const { category } = req.params
    const featureFlags = await FeatureFlag.find({ category })
      .populate('createdBy', 'name email')
      .sort({ name: 1 })

    res.status(200).json({
      success: true,
      data: featureFlags,
    })
  } catch (error) {
    next(error)
  }
}
