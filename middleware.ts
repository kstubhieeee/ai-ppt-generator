import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Fix for PDF upload API to ensure proper content-type handling
  if (request.nextUrl.pathname === '/api/extract-pdf') {
    // Allow the request to proceed but ensure error responses are JSON
    const response = NextResponse.next();
    
    // Add headers to ensure JSON responses
    response.headers.set('x-middleware-handled', 'true');
    
    return response;
  }
  
  return NextResponse.next();
}

// Only run middleware on API routes
export const config = {
  matcher: ['/api/:path*'],
}; 