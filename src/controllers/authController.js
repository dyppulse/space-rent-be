import User from "../models/User.js"
import { StatusCodes } from "http-status-codes"
import { BadRequestError, UnauthenticatedError } from "../errors/index.js"

// Register a new user (space owner)
export const register = async (req, res) => {
  const { name, email, password, phone } = req.body

  if (!name || !email || !password || !phone) {
    throw new BadRequestError("Please provide all required fields")
  }

  // Check if email already exists
  const emailExists = await User.findOne({ email })
  if (emailExists) {
    throw new BadRequestError("Email already exists")
  }

  const user = await User.create({ name, email, password, phone })
  const token = user.createJWT()

  res.status(StatusCodes.CREATED).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    token,
  })
}

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new BadRequestError("Please provide email and password")
  }

  const user = await User.findOne({ email }).select("+password")

  if (!user) {
    throw new UnauthenticatedError("Invalid credentials")
  }

  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new UnauthenticatedError("Invalid credentials")
  }

  const token = user.createJWT()

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
    token,
  })
}

// Get current user profile
export const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId)

  if (!user) {
    throw new UnauthenticatedError("User not found")
  }

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  })
}

// Update user profile
export const updateProfile = async (req, res) => {
  const { name, phone } = req.body

  if (!name) {
    throw new BadRequestError("Name is required")
  }

  const user = await User.findByIdAndUpdate(req.user.userId, { name, phone }, { new: true, runValidators: true })

  res.status(StatusCodes.OK).json({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  })
}
