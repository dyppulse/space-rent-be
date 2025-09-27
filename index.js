import { readFile } from 'fs/promises'

import { v2 as cloudinary } from 'cloudinary'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import dotenv from 'dotenv-safe'
import express from 'express'
import mongoose from 'mongoose'
import swaggerUi from 'swagger-ui-express'

import { errorHandler } from './src/middleware/errorHandler.js'
import adminRoutes from './src/routes/admin.js'
import authRoutes from './src/routes/auth.js'
import bookingRoutes from './src/routes/bookings.js'
import locationRoutes from './src/routes/locations.js'
import spaceRoutes from './src/routes/spaces.js'
import spaceTypeRoutes from './src/routes/spaceTypes.js'

// Load environment variables
dotenv.config({
  example: '.env.example', // default, optional
  allowEmptyValues: false, // make sure all values are non-empty
})

// Initialize express app
const app = express()
const swaggerOutput = JSON.parse(await readFile(new URL('./swagger-output.json', import.meta.url)))
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerOutput))

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://space-rent-fe.vercel.app',
  process.env.FRONTEND_APP_URL,
]

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error('Not allowed by CORS'))
      }
    },
    credentials: true,
  })
)
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/spaces', spaceRoutes)
app.use('/api/space-types', spaceTypeRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/locations', locationRoutes)

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' })
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB and start server
const PORT = process.env.PORT || 4000

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB')
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  })

export default app
