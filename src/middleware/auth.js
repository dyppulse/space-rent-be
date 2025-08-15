import jwt from 'jsonwebtoken'

import { UnauthenticatedError } from '../errors/index.js'

export const authenticateUser = async (req, _res, next) => {
  const tokenFromHeader = req.headers.authorization?.startsWith('Bearer ')
    ? req.headers.authorization.split(' ')[1]
    : null

  const tokenFromCookie = req.cookies?.token

  const token = tokenFromCookie || tokenFromHeader

  if (!token) {
    throw new UnauthenticatedError('Authentication invalid')
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    }

    next()
  } catch (_error) {
    console.error(_error)
    throw new UnauthenticatedError('Authentication invalid')
  }
}

export const authorizeRoles = (...allowedRoles) => {
  return (req, _res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      throw new UnauthenticatedError('Not authorized')
    }
    next()
  }
}
