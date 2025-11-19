import { StatusCodes } from 'http-status-codes'

import { BadRequestError, NotFoundError } from '../errors/index.js'
import Lead from '../models/Lead.js'
import logger from '../utils/logger.js'

// Create a new lead (public endpoint)
export const createLead = async (req, res, next) => {
  const { name, email, phone, eventType, eventDate, city, guestCount, budgetRange, notes } =
    req.body

  try {
    // Validate required fields
    if (
      !name ||
      !email ||
      !phone ||
      !eventType ||
      !eventDate ||
      !city ||
      !guestCount ||
      !budgetRange
    ) {
      const error = new BadRequestError('Please provide all required fields')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Validate email format
    const emailRegex =
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    if (!emailRegex.test(email)) {
      const error = new BadRequestError('Please provide a valid email address')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Validate guest count
    if (guestCount < 1) {
      const error = new BadRequestError('Guest count must be at least 1')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Validate event date is in the future
    const eventDateObj = new Date(eventDate)
    if (isNaN(eventDateObj.getTime())) {
      const error = new BadRequestError('Please provide a valid event date')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    // Create lead
    const lead = await Lead.create({
      name,
      email,
      phone,
      eventType,
      eventDate: eventDateObj,
      city,
      guestCount: parseInt(guestCount, 10),
      budgetRange,
      notes: notes || '',
      status: 'new',
    })

    logger.info('New lead created', {
      leadId: lead._id,
      email: lead.email,
      eventType: lead.eventType,
    })

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Lead submitted successfully',
      data: lead,
    })
  } catch (error) {
    logger.error('Error creating lead', { error: error.message })
    next(error)
  }
}

// Get all leads (admin only)
export const getLeads = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const query = status ? { status } : {}

    const leads = await Lead.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))

    const total = await Lead.countDocuments(query)

    res.status(StatusCodes.OK).json({
      success: true,
      data: leads,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    })
  } catch (error) {
    logger.error('Error fetching leads', { error: error.message })
    next(error)
  }
}

// Get single lead (admin only)
export const getLead = async (req, res, next) => {
  try {
    const { id } = req.params
    const lead = await Lead.findById(id)

    if (!lead) {
      const error = new NotFoundError('Lead not found')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: lead,
    })
  } catch (error) {
    logger.error('Error fetching lead', { error: error.message })
    next(error)
  }
}

// Update lead status (admin only)
export const updateLeadStatus = async (req, res, next) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['new', 'contacted', 'converted', 'closed'].includes(status)) {
      const error = new BadRequestError('Please provide a valid status')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const lead = await Lead.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })

    if (!lead) {
      const error = new NotFoundError('Lead not found')
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    logger.info('Lead status updated', {
      leadId: lead._id,
      status: lead.status,
    })

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead,
    })
  } catch (error) {
    logger.error('Error updating lead status', { error: error.message })
    next(error)
  }
}
