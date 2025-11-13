// Vercel serverless function wrapper for Express app
// This file is required for Vercel to properly route API requests

import app from '../server/index.js';

// Export the Express app as a serverless function
// Vercel will automatically handle the routing
export default app;

