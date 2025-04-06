import { NextRequest, NextResponse } from 'next/server';

// Centralized image service that tries multiple sources for best images
export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    const cleanTerm = searchTerm.trim();
    console.log(`Finding best image for: "${cleanTerm}"`);
    
    // Step 1: Try Pexels API for high-quality curated images
    try {
      // Use the full URL with hostname for server-to-server requests
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
      const host = request.headers.get('host') || 'localhost:3000';
      const baseUrl = `${protocol}://${host}`;
      
      const pexelsResponse = await fetch(`${baseUrl}/api/pexels-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm: cleanTerm })
      });
      
      const pexelsData = await pexelsResponse.json();
      
      if (pexelsResponse.ok && pexelsData.photos && pexelsData.photos.length > 0) {
        console.log(`Found ${pexelsData.photos.length} Pexels images for "${cleanTerm}"`);
        
        // Return the highest quality Pexels image
        const bestPhoto = pexelsData.photos[0];
        return NextResponse.json({
          imageUrl: bestPhoto.src.large2x || bestPhoto.src.large || bestPhoto.src.medium,
          thumbnails: pexelsData.photos.map((p: any) => p.src.small),
          alt: bestPhoto.alt,
          searchTerm: cleanTerm,
          attribution: {
            photographer: bestPhoto.photographer,
            photographerUrl: bestPhoto.photographer_url,
            source: 'Pexels',
            sourceUrl: bestPhoto.url
          },
          source: 'pexels'
        });
      }
      
      console.log(`No Pexels images found for "${cleanTerm}", falling back to placeholder...`);
    } catch (pexelsError) {
      console.error(`Pexels API error for "${cleanTerm}":`, pexelsError);
    }
    
    // Step 2: Fall back to placeholder
    console.log(`Using placeholder image for "${cleanTerm}"`);
    return generatePlaceholder(cleanTerm);
    
  } catch (error) {
    console.error('Error in image service API:', error);
    return NextResponse.json({ 
      error: 'Failed to find suitable image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Helper function to generate a placeholder image URL
function generatePlaceholder(searchTerm: string) {
  // Generate a timestamp to prevent caching
  const timestamp = new Date().getTime();
  
  // Define theme colors (match with the presentation component)
  const themes = [
    { bgColor: '#f0f9ff', textColor: '#0c4a6e' }, // Blue
    { bgColor: '#f0fdf4', textColor: '#14532d' }, // Green
    { bgColor: '#fef2f2', textColor: '#7f1d1d' }, // Red
    { bgColor: '#faf5ff', textColor: '#581c87' }, // Purple
  ];
  
  // Choose a theme based on the first character of the search term (for consistency)
  const themeIndex = searchTerm.charCodeAt(0) % themes.length;
  const theme = themes[themeIndex];
  
  // Create a placeholder URL
  const placeholderUrl = `https://placehold.co/800x600/${theme.bgColor.replace('#', '')}/${theme.textColor.replace('#', '')}?text=${encodeURIComponent(searchTerm)}&t=${timestamp}`;
  
  return NextResponse.json({
    imageUrl: placeholderUrl,
    searchTerm: searchTerm,
    timestamp: timestamp,
    source: 'placeholder'
  });
} 