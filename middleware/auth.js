import jwt from "jsonwebtoken"
import { UnauthenticatedError } from "../errors/index.js"

export const authenticateUser = async (req, res, next) => {
  // Check for auth header
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthenticatedError("Authentication invalid")
  }

  const token = authHeader.split(" ")[1]

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)

    // Attach user info to request object
    req.user = {
      userId: payload.userId,
      name: payload.name,
      role: payload.role,
    }

    next()
  } catch (error) {
    throw new UnauthenticatedError("Authentication invalid")
  }
}
