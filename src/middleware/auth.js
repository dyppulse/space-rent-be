import jwt from 'jsonwebtoken'

import { UnauthenticatedError } from '../errors/index.js'

export const authenticateUser = async (req, _res, next) => {
  // Check for auth header
  const authHeader = req.headers.authorization

  console.log(authHeader, 'authHeader')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthenticatedError('Authentication invalid')
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to request object
    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    }

    next()
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid')
  }
}
