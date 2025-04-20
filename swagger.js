import swaggerAutogen from 'swagger-autogen'

const doc = {
  info: {
    title: 'Space Rental API',
    description: 'Auto-generated Swagger documentation',
  },
  host: 'localhost:4000', // or your deployed host
  schemes: ['http'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      in: 'header',
      name: 'Authorization',
      description: 'JWT Authorization header using the Bearer scheme.',
    },
  },
}

const outputFile = './swagger-output.json'
const endpointsFiles = ['./index.js'] // or wherever you define your Express routes

swaggerAutogen(outputFile, endpointsFiles, doc)
