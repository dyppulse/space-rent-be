import express from "express"
import cors from "cors"
import dotenv from "dotenv"
import mongoose from "mongoose"
import swaggerUi from 'swagger-ui-express'
import swaggerDocument from './swagger-output.json' assert { type: 'json' }
import authRoutes from "./src/routes/auth.js"
import spaceRoutes from "./src/routes/spaces.js"
import bookingRoutes from "./src/routes/bookings.js"
import { errorHandler } from "./src/middleware/errorHandler.js"

// Load environment variables
dotenv.config()

// Initialize express app
const app = express()

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/spaces", spaceRoutes)
app.use("/api/bookings", bookingRoutes)

// Health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" })
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB")
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error)
    process.exit(1)
  })

export default app
