import { NextConfig } from 'next';

// This exports a configuration object for all API route handlers
export const routeHandlerConfig: NextConfig = {
  api: {
    // Increase the body size limit for uploads (like PDFs)
    bodyParser: {
      sizeLimit: '10mb',
    },
    // Increase the response size limit
    responseLimit: false,
  },
}; 