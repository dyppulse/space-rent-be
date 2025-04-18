import express from "express"
import {
  createBooking,
  getOwnerBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats,
} from "../controllers/bookingController.js"
import { authenticateUser } from "../middleware/auth.js"

const router = express.Router()

// Public routes
router.post("/", createBooking)

// Protected routes
router.get("/owner", authenticateUser, getOwnerBookings)
router.get("/stats", authenticateUser, getBookingStats)
router.get("/:id", authenticateUser, getBooking)
router.patch("/:id/status", authenticateUser, updateBookingStatus)

export default router
