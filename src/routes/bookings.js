import express from "express";
import {
  createBooking,
  getOwnerBookings,
  getBooking,
  updateBookingStatus,
  getBookingStats,
} from "../controllers/bookingController.js";
import { authenticateUser } from "../middleware/auth.js";

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [spaceId, startDate, endDate]
 *             properties:
 *               spaceId:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post("/", createBooking);

/**
 * @swagger
 * /api/bookings/owner:
 *   get:
 *     summary: Get bookings for the authenticated space owner
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings for the owner
 */
router.get("/owner", authenticateUser, getOwnerBookings);

/**
 * @swagger
 * /api/bookings/stats:
 *   get:
 *     summary: Get booking statistics for the authenticated owner
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Booking stats
 */
router.get("/stats", authenticateUser, getBookingStats);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a specific booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get("/:id", authenticateUser, getBooking);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   patch:
 *     summary: Update booking status
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, cancelled, completed]
 *     responses:
 *       200:
 *         description: Booking status updated
 */
router.patch("/:id/status", authenticateUser, updateBookingStatus);

export default router;
