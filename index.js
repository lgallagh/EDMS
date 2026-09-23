const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const Server = require('./backend/server').Server;

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// CORS Configuration
const corsOptions = {
  origin: process.env.ORIGIN,
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Set the port, falling back to APP_PORT if PORT isn't set
const port = process.env.PORT || process.env.APP_PORT;

// Initialize and start the server
const server = new Server(app);

// When running in IIS, the port 'number' may be alphanumeric, so avoid forcing it to a number
server.start(port);
