import { StatusCodes } from 'http-status-codes'

import { BadRequestError, NotFoundError } from '../errors/index.js'
import County from '../models/County.js'
import District from '../models/District.js'
import Parish from '../models/Parish.js'
import Region from '../models/Region.js'
import Subcounty from '../models/Subcounty.js'
import Village from '../models/Village.js'

// Generic CRUD operations for all location types
const createLocation =
  (Model, parentModel = null, parentField = null) =>
  async (req, res, next) => {
    try {
      const data = req.body

      // If there's a parent model, validate it exists
      if (parentModel && parentField && data[parentField]) {
        const parent = await parentModel.findById(data[parentField])
        if (!parent) {
          throw new BadRequestError(`Invalid ${parentField}`)
        }
      }

      const location = await Model.create(data)
      res.status(StatusCodes.CREATED).json(location)
    } catch (err) {
      next(err)
    }
  }

const getAllLocations =
  (Model, parentField = null) =>
  async (req, res, next) => {
    try {
      const { parentId } = req.query
      let query = { isActive: true }

      // Filter by parent if parentId is provided
      if (parentId && parentField) {
        query[parentField] = parentId
      }

      let queryBuilder = Model.find(query)

      // Only populate if there's a parent field and it's not empty
      if (parentField && parentField.trim() !== '') {
        queryBuilder = queryBuilder.populate(parentField, 'name code')
      }

      const locations = await queryBuilder.sort({ name: 1 })

      res.status(StatusCodes.OK).json(locations)
    } catch (err) {
      next(err)
    }
  }

const getLocationById = (Model) => async (req, res, next) => {
  try {
    const { id } = req.params
    const location = await Model.findById(id)

    if (!location) {
      throw new NotFoundError(`${Model.modelName} not found`)
    }

    res.status(StatusCodes.OK).json(location)
  } catch (err) {
    next(err)
  }
}

const updateLocation = (Model) => async (req, res, next) => {
  try {
    const { id } = req.params
    const location = await Model.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })

    if (!location) {
      throw new NotFoundError(`${Model.modelName} not found`)
    }

    res.status(StatusCodes.OK).json(location)
  } catch (err) {
    next(err)
  }
}

const deleteLocation = (Model) => async (req, res, next) => {
  try {
    const { id } = req.params
    const location = await Model.findByIdAndUpdate(id, { isActive: false }, { new: true })

    if (!location) {
      throw new NotFoundError(`${Model.modelName} not found`)
    }

    res.status(StatusCodes.OK).json({ message: `${Model.modelName} deactivated successfully` })
  } catch (err) {
    next(err)
  }
}

// Region controllers
export const createRegion = createLocation(Region)
export const getAllRegions = getAllLocations(Region)
export const getRegionById = getLocationById(Region)
export const updateRegion = updateLocation(Region)
export const deleteRegion = deleteLocation(Region)

// District controllers
export const createDistrict = createLocation(District, Region, 'region')
export const getAllDistricts = getAllLocations(District, 'region')
export const getDistrictById = getLocationById(District)
export const updateDistrict = updateLocation(District)
export const deleteDistrict = deleteLocation(District)

// County controllers
export const createCounty = createLocation(County, District, 'district')
export const getAllCounties = getAllLocations(County, 'district')
export const getCountyById = getLocationById(County)
export const updateCounty = updateLocation(County)
export const deleteCounty = deleteLocation(County)

// Subcounty controllers
export const createSubcounty = createLocation(Subcounty, County, 'county')
export const getAllSubcounties = getAllLocations(Subcounty, 'county')
export const getSubcountyById = getLocationById(Subcounty)
export const updateSubcounty = updateLocation(Subcounty)
export const deleteSubcounty = deleteLocation(Subcounty)

// Parish controllers
export const createParish = createLocation(Parish, Subcounty, 'subcounty')
export const getAllParishes = getAllLocations(Parish, 'subcounty')
export const getParishById = getLocationById(Parish)
export const updateParish = updateLocation(Parish)
export const deleteParish = deleteLocation(Parish)

// Village controllers
export const createVillage = createLocation(Village, Parish, 'parish')
export const getAllVillages = getAllLocations(Village, 'parish')
export const getVillageById = getLocationById(Village)
export const updateVillage = updateLocation(Village)
export const deleteVillage = deleteLocation(Village)

// Get complete location hierarchy for a space
export const getLocationHierarchy = async (req, res, next) => {
  try {
    const { villageId } = req.params

    const village = await Village.findById(villageId).populate({
      path: 'parish',
      populate: {
        path: 'subcounty',
        populate: {
          path: 'county',
          populate: {
            path: 'district',
            populate: {
              path: 'region',
            },
          },
        },
      },
    })

    if (!village) {
      throw new NotFoundError('Village not found')
    }

    res.status(StatusCodes.OK).json(village)
  } catch (err) {
    next(err)
  }
}
