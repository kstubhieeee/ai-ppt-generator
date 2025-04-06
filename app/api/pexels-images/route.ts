import { NextRequest, NextResponse } from 'next/server';

// API endpoint to fetch high-quality images from Pexels
export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Clean and prepare the search term
    const cleanTerm = searchTerm.trim();
    console.log(`Searching Pexels for: "${cleanTerm}"`);
    
    // Get Pexels API key from environment variable
    const apiKey = process.env.PEXELS_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.log('Pexels API key not found, falling back to Gemini or placeholder');
      return NextResponse.json({ 
        error: 'Pexels API key not configured',
        searchTerm: cleanTerm 
      });
    }
    
    try {
      // Prepare the API URL
      const apiUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(cleanTerm)}&per_page=10&orientation=landscape`;
      
      // Call the Pexels API
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': apiKey
        }
      });
      
      if (!response.ok) {
        throw new Error(`Pexels API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.photos && data.photos.length > 0) {
        // Sort photos by relevance (we'll use highest resolution as proxy for quality)
        const sortedPhotos = data.photos.sort((a: any, b: any) => {
          const aSize = a.width * a.height;
          const bSize = b.width * b.height;
          return bSize - aSize; // Higher resolution first
        });
        
        // Get the top 3 photos
        const topPhotos = sortedPhotos.slice(0, 3).map((photo: any) => ({
          id: photo.id,
          width: photo.width,
          height: photo.height,
          url: photo.url,
          photographer: photo.photographer,
          photographer_url: photo.photographer_url,
          src: photo.src,
          alt: photo.alt || cleanTerm
        }));
        
        return NextResponse.json({
          photos: topPhotos,
          searchTerm: cleanTerm,
          source: 'pexels'
        });
      } else {
        // No photos found
        return NextResponse.json({ 
          error: 'No images found on Pexels',
          searchTerm: cleanTerm
        });
      }
    } catch (apiError) {
      console.error('Error fetching from Pexels API:', apiError);
      return NextResponse.json({ 
        error: 'Failed to fetch images from Pexels',
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        searchTerm: cleanTerm
      });
    }
  } catch (error) {
    console.error('Error in Pexels image search API:', error);
    return NextResponse.json({ 
      error: 'Failed to process image search',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 