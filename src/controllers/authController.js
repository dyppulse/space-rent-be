import crypto from 'crypto'

import { StatusCodes } from 'http-status-codes'

import { BadRequestError, UnauthenticatedError } from '../errors/index.js'
import User from '../models/User.js'
import {
  sendVerificationEmail,
  sendOwnerVerificationPendingEmail,
  sendUpgradeRequestSubmittedEmail,
} from '../utils/emailService.js'

// Register a new client
export const registerClient = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password || !phone) {
      throw new BadRequestError('Please provide all required fields')
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email })
    if (emailExists) {
      throw new BadRequestError('Email already exists')
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'client',
      roles: ['client'],
      activeRole: 'client',
      emailVerificationToken,
      emailVerificationExpires,
      emailVerified: false,
    })

    // Send verification email
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationToken: emailVerificationToken,
      })
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Continue even if email fails
    }

    const token = user.createJWT()

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    }

    res.cookie('token', token, cookieOptions)

    res.status(StatusCodes.CREATED).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        activeRole: user.activeRole,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
      },
      requiresEmailVerification: true,
    })
  } catch (err) {
    next(err)
  }
}

// Register a new owner (with verification)
export const registerOwner = async (req, res, next) => {
  try {
    const { name, email, password, phone, verificationInfo } = req.body

    if (!name || !email || !password || !phone) {
      throw new BadRequestError('Please provide all required fields')
    }

    // Check if email already exists
    const emailExists = await User.findOne({ email })
    if (emailExists) {
      throw new BadRequestError('Email already exists')
    }

    // Generate verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'owner',
      roles: ['client', 'owner'],
      activeRole: 'client', // Start as client until verified
      emailVerificationToken,
      emailVerificationExpires,
      emailVerified: false,
      isVerified: false,
      ...(verificationInfo && {
        verificationInfo: {
          ...verificationInfo,
          submittedAt: new Date(),
        },
      }),
    })

    // Send verification emails
    try {
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationToken: emailVerificationToken,
      })
      await sendOwnerVerificationPendingEmail({
        to: user.email,
        name: user.name,
      })
    } catch (emailError) {
      console.error('Error sending verification email:', emailError)
      // Continue even if email fails
    }

    const token = user.createJWT()

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    }

    res.cookie('token', token, cookieOptions)

    res.status(StatusCodes.CREATED).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        activeRole: user.activeRole,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
      },
      requiresEmailVerification: true,
      requiresAdminVerification: true,
    })
  } catch (err) {
    next(err)
  }
}

// Login user
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      const error = new BadRequestError('Please provide email and password')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      const error = new UnauthenticatedError('Invalid credentials')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect) {
      const error = new UnauthenticatedError('Invalid credentials')
      // Use the error object to construct the response
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      })
    }

    const token = user.createJWT()

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    }

    res.cookie('token', token, cookieOptions)

    res.status(StatusCodes.OK).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    })
  } catch (err) {
    next(err)
  }
}

// Get current user profile
export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId)

  if (!user) {
    const error = new UnauthenticatedError('User not found')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  })
}

// Logout user
export const logout = async (_req, res) => {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/',
  }
  res.clearCookie('token', cookieOptions)
  res.status(StatusCodes.OK).json({ success: true })
}

// Update user profile
export const updateProfile = async (req, res) => {
  const { name, phone } = req.body

  if (!name) {
    const error = new BadRequestError('Name is required')
    // Use the error object to construct the response
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    })
  }

  const user = await User.findByIdAndUpdate(
    req.user.userId,
    { name, phone },
    { new: true, runValidators: true }
  )

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  })
}

// Verify email address
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.query

    if (!token) {
      throw new BadRequestError('Verification token is required')
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    })

    if (!user) {
      throw new BadRequestError('Invalid or expired verification token')
    }

    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpires = undefined
    await user.save()

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Email verified successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Submit upgrade request (client to owner)
export const submitUpgradeRequest = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { verificationInfo } = req.body

    const user = await User.findById(userId)

    if (!user) {
      throw new BadRequestError('User not found')
    }

    // Check if user already has owner role
    if (user.roles.includes('owner')) {
      throw new BadRequestError('User already has owner role')
    }

    // Check if there's already a pending request
    if (user.upgradeRequest?.status === 'pending') {
      throw new BadRequestError('You already have a pending upgrade request')
    }

    user.upgradeRequest = {
      status: 'pending',
      submittedAt: new Date(),
      ...(verificationInfo && { verificationInfo }),
    }

    await user.save()

    // Send confirmation email
    try {
      await sendUpgradeRequestSubmittedEmail({
        to: user.email,
        name: user.name,
      })
    } catch (emailError) {
      console.error('Error sending upgrade request email:', emailError)
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Upgrade request submitted successfully',
    })
  } catch (err) {
    next(err)
  }
}

// Switch active role
export const switchRole = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { role } = req.body

    if (!['client', 'owner'].includes(role)) {
      throw new BadRequestError('Invalid role. Must be client or owner')
    }

    const user = await User.findById(userId)

    if (!user) {
      throw new BadRequestError('User not found')
    }

    // Check if user has the requested role
    if (!user.roles.includes(role)) {
      throw new BadRequestError(`You don't have permission to switch to ${role} role`)
    }

    // If switching to owner, check if verified
    if (role === 'owner' && !user.isVerified) {
      throw new BadRequestError('Owner verification pending. You cannot switch to owner view yet.')
    }

    user.activeRole = role
    user.role = role // For backward compatibility
    await user.save()

    const token = user.createJWT()

    const isProd = process.env.NODE_ENV === 'production'
    const cookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      path: '/',
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
    }

    res.cookie('token', token, cookieOptions)

    res.status(StatusCodes.OK).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        roles: user.roles,
        activeRole: user.activeRole,
        emailVerified: user.emailVerified,
        isVerified: user.isVerified,
      },
    })
  } catch (err) {
    next(err)
  }
}
