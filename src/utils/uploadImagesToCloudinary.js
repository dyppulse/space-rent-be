import { v2 as cloudinary } from 'cloudinary'

// You can optionally wrap this in a Promise.all for multiple uploads
export const uploadImagesToCloudinary = async (files, folder = 'spaces') => {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const result = await cloudinary.uploader.upload(file.path, {
        folder,
        resource_type: 'image',
      })

      return {
        public_id: result.public_id,
        url: result.secure_url,
      }
    })
  )

  return uploads
}

/**
 * Deletes an image from Cloudinary using its public_id
 * @param {string} publicId - The public_id of the image stored in Cloudinary
 * @returns {Promise<void>}
 */
export const deleteFromCloudinary = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('publicId is required to delete an image from Cloudinary')
    }

    await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
    })
  } catch (error) {
    console.error(`❌ Failed to delete image from Cloudinary: ${error.message}`)
    throw error
  }
}

export const deleteMultipleFromCloudinary = async (publicIds = []) => {
  if (!Array.isArray(publicIds) || publicIds.length === 0) return

  try {
    await Promise.all(
      publicIds.map((id) =>
        cloudinary.uploader.destroy(id, {
          resource_type: 'image',
        })
      )
    )
  } catch (err) {
    console.error(`❌ Bulk deletion failed: ${err.message}`)
    throw err
  }
}
