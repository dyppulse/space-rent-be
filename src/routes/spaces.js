import { v2 as cloudinary } from 'cloudinary'
import express from 'express'

import {
  createSpace,
  getAllSpaces,
  getSpace,
  getMySpaces,
  updateSpace,
  deleteSpace,
  addSpaceImages,
  removeSpaceImage,
} from '../controllers/spaceController.js'
import { authenticateUser } from '../middleware/auth.js'
import { upload } from '../middleware/multer.js'

const router = express.Router()

router.get('/', getAllSpaces)

router.get('/:id', getSpace)

router.post('/', authenticateUser, upload.array('images', 10), createSpace)

router.get('/owner/my-spaces', authenticateUser, getMySpaces)

router.patch('/:id', authenticateUser, upload.array('images', 10), updateSpace)

router.delete('/:id', authenticateUser, deleteSpace)

router.post('/:id/images', authenticateUser, addSpaceImages)

router.delete('/:id/images', authenticateUser, removeSpaceImage)

// DELETE endpoint to remove an image
router.delete('/images/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params

    if (!publicId) {
      return res.status(400).json({ error: 'Public ID is required' })
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId)

    if (result.result === 'ok') {
      res.json({ message: 'Image deleted successfully' })
    } else {
      res.status(500).json({ error: 'Failed to delete image', details: result })
    }
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    res.status(500).json({ error: 'Failed to delete image' })
  }
})

// DELETE endpoint to remove all images for a space
router.delete('/:spaceId/images', async (req, res) => {
  try {
    const { spaceId } = req.params

    // Get all resources in the folder
    const resources = await cloudinary.search.expression(`folder:spaces/${spaceId}`).execute()

    if (resources.resources.length === 0) {
      return res.json({ message: 'No images found for this space' })
    }

    // Delete all resources
    const deletePromises = resources.resources.map((resource) => {
      return cloudinary.uploader.destroy(resource.public_id)
    })

    await Promise.all(deletePromises)

    // Delete the folder
    await cloudinary.api.delete_folder(`spaces/${spaceId}`)

    res.json({ message: 'All images for this space deleted successfully' })
  } catch (error) {
    console.error('Error deleting space images from Cloudinary:', error)
    res.status(500).json({ error: 'Failed to delete space images' })
  }
})

// GET endpoint to retrieve a specific image with transformations
router.get('/images/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params
    const { width, height, crop } = req.query

    let transformation = {}

    if (width) transformation.width = parseInt(width)
    if (height) transformation.height = parseInt(height)
    if (crop) transformation.crop = crop

    const url = cloudinary.url(publicId, {
      transformation: Object.keys(transformation).length > 0 ? [transformation] : [],
    })

    res.json({ url })
  } catch (error) {
    console.error('Error generating image URL:', error)
    res.status(500).json({ error: 'Failed to generate image URL' })
  }
})

// Helper endpoint to get image URLs for a space (useful for frontend)
router.get('/:spaceId/imageUrls', async (req, res) => {
  try {
    const { spaceId } = req.params

    const result = await cloudinary.search
      .expression(`folder:spaces/${spaceId}`)
      .sort_by('created_at', 'desc')
      .max_results(30)
      .execute()

    const imageUrls = {
      thumbnails: result.resources.map((resource) =>
        cloudinary.url(resource.public_id, {
          transformation: [{ width: 300, height: 200, crop: 'fill' }],
        })
      ),
      fullSize: result.resources.map((resource) => cloudinary.url(resource.public_id)),
      resources: result.resources,
    }

    res.json(imageUrls)
  } catch (error) {
    console.error('Error fetching space image URLs:', error)
    res.status(500).json({ error: 'Failed to fetch image URLs' })
  }
})

export default router
