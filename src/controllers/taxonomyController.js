import { StatusCodes } from 'http-status-codes'

import Taxonomy from '../models/Taxonomy.js'

export const listTaxonomies = async (req, res, next) => {
  try {
    const { type, includeInactive } = req.query
    const query = {}
    if (type) query.type = type
    if (!includeInactive) query.isActive = true
    const items = await Taxonomy.find(query).sort({ sortOrder: 1, label: 1 })
    res.status(StatusCodes.OK).json({ items })
  } catch (err) {
    next(err)
  }
}

export const createTaxonomy = async (req, res, next) => {
  try {
    const { type, key, label, description, sortOrder } = req.body
    const item = await Taxonomy.create({ type, key, label, description, sortOrder })
    res.status(StatusCodes.CREATED).json({ item })
  } catch (err) {
    next(err)
  }
}

export const updateTaxonomy = async (req, res, next) => {
  try {
    const { id } = req.params
    const { key, label, description, isActive, sortOrder } = req.body
    const item = await Taxonomy.findByIdAndUpdate(
      id,
      { key, label, description, isActive, sortOrder },
      { new: true, runValidators: true }
    )
    res.status(StatusCodes.OK).json({ item })
  } catch (err) {
    next(err)
  }
}

export const deleteTaxonomy = async (req, res, next) => {
  try {
    const { id } = req.params
    await Taxonomy.findByIdAndDelete(id)
    res.status(StatusCodes.NO_CONTENT).send()
  } catch (err) {
    next(err)
  }
}
