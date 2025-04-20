import { StatusCodes } from 'http-status-codes'

export const errorHandler = (err, req, res) => {
  console.log(err)

  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, try again later',
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ')
  }

  // Duplicate key error
  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = `${Object.keys(err.keyValue)} field has to be unique`
  }

  // Cast error (invalid ID)
  if (err.name === 'CastError') {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = `Invalid ${err.path}: ${err.value}`
  }

  res.status(defaultError.statusCode).json({ error: defaultError.msg })
}
