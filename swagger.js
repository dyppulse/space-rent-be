import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Space Rent',
      version: '1.0.0',
      description: 'Rent space',
    },
    servers: [
      {
        url: 'http://localhost:4000', // Change this based on your server
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API docs (adjust to your project structure)
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
