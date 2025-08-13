import { StatusCodes } from 'http-status-codes'

import LocationRef from '../models/LocationRef.js'

export const listLocationRefs = async (req, res, next) => {
  try {
    const { district, county, subCounty, parish, village, includeInactive } = req.query
    const query = {}
    if (district) query.district = new RegExp(district, 'i')
    if (county) query.county = new RegExp(county, 'i')
    if (subCounty) query.subCounty = new RegExp(subCounty, 'i')
    if (parish) query.parish = new RegExp(parish, 'i')
    if (village) query.village = new RegExp(village, 'i')
    if (!includeInactive) query.isActive = true
    const items = await LocationRef.find(query).sort({
      district: 1,
      county: 1,
      subCounty: 1,
      parish: 1,
      village: 1,
    })
    res.status(StatusCodes.OK).json({ items })
  } catch (err) {
    next(err)
  }
}

export const createLocationRef = async (req, res, next) => {
  try {
    const item = await LocationRef.create(req.body)
    res.status(StatusCodes.CREATED).json({ item })
  } catch (err) {
    next(err)
  }
}

export const updateLocationRef = async (req, res, next) => {
  try {
    const { id } = req.params
    const item = await LocationRef.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    })
    res.status(StatusCodes.OK).json({ item })
  } catch (err) {
    next(err)
  }
}

export const deleteLocationRef = async (req, res, next) => {
  try {
    const { id } = req.params
    await LocationRef.findByIdAndDelete(id)
    res.status(StatusCodes.NO_CONTENT).send()
  } catch (err) {
    next(err)
  }
}
