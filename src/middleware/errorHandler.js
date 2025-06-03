import { StatusCodes } from 'http-status-codes'

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
  console.log(err)

  const defaultError = {
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    msg: err.message || 'Something went wrong, try again later',
  }

  // Validation errors (e.g. Mongoose schema validation)
  if (err.name === 'ValidationError') {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = Object.values(err.errors)
      .map((item) => item.message)
      .join(', ')
  }

  // Duplicate key error (e.g. unique constraint violation)
  if (err.code && err.code === 11000) {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = `${Object.keys(err.keyValue)} field has to be unique`
  }

  // CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    defaultError.statusCode = StatusCodes.BAD_REQUEST
    defaultError.msg = `Invalid ${err.path}: ${err.value}`
  }

  res.status(defaultError.statusCode).json({ error: defaultError.msg })
}
