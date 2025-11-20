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
import featureFlagRoutes from './src/routes/featureFlags.js'
import leadRoutes from './src/routes/leads.js'
import locationRoutes from './src/routes/locations.js'
import paymentRoutes from './src/routes/payments.js'
import spaceRoutes from './src/routes/spaces.js'
import spaceTypeRoutes from './src/routes/spaceTypes.js'
import logger from './src/utils/logger.js'

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
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:3000',
  'https://space-rent-fe.vercel.app',
  process.env.FRONTEND_APP_URL,
].filter(Boolean) // Remove undefined values

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true)
      }

      // Check if origin is in allowed list
      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      // In development, allow any localhost origin
      if (process.env.NODE_ENV !== 'production') {
        if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
          return callback(null, true)
        }
      }

      callback(new Error('Not allowed by CORS'))
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/feature-flags', featureFlagRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/leads', leadRoutes)

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
    logger.success('Connected to MongoDB')
    app.listen(PORT, () => {
      logger.success(`Server running on port ${PORT}`)
      logger.info('API Documentation available at /api-docs')
    })
  })
  .catch((error) => {
    logger.error('MongoDB connection error', { error: error.message })
    process.exit(1)
  })

export default app
