import path from 'path'

import multer from 'multer'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif', '.bmp', '.tiff']

  // Check if it's an image file by extension
  if (allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    // Also check MIME type as a fallback
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      // Create a more descriptive error
      const error = new Error(
        `Only image files are allowed. Received: ${file.originalname} (${file.mimetype})`
      )
      error.code = 'INVALID_FILE_TYPE'
      cb(error)
    }
  }
}

export const upload = multer({ storage, fileFilter })
