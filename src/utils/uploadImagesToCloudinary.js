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
