import { NextRequest, NextResponse } from 'next/server';

// This API now returns only reliable placeholder image URLs
export async function POST(request: NextRequest) {
  try {
    const { searchTerm } = await request.json();
    
    if (!searchTerm) {
      return NextResponse.json({ error: 'Search term is required' }, { status: 400 });
    }

    // Clean and prepare the search term
    const cleanTerm = searchTerm.trim();
    console.log(`Generating placeholder for term: "${cleanTerm}"`);
    
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
    const themeIndex = cleanTerm.charCodeAt(0) % themes.length;
    const theme = themes[themeIndex];
    
    // Create a placeholder URL
    const placeholderUrl = `https://placehold.co/800x600/${theme.bgColor.replace('#', '')}/${theme.textColor.replace('#', '')}?text=${encodeURIComponent(cleanTerm)}&t=${timestamp}`;
    
    return NextResponse.json({
      imageUrl: placeholderUrl,
      searchTerm: cleanTerm,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('Error in image API:', error);
    return NextResponse.json({ 
      error: 'Failed to generate image URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 