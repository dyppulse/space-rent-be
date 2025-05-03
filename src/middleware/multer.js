import path from 'path'

import multer from 'multer'

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
})

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
    cb(null, true)
  } else {
    cb(new Error('Only images are allowed'))
  }
}

export const upload = multer({ storage, fileFilter })
