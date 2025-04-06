'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface Slide {
  slide: number;
  heading: string;
  points: string[];
  image: string;
}

interface PresentationProps {
  slides: Slide[];
}

// Define theme colors for slides with better colors for placeholders
const slideThemes = [
  { bgColor: '#f0f9ff', textColor: '#0c4a6e', accentColor: '#0284c7' }, // Blue
  { bgColor: '#f0fdf4', textColor: '#14532d', accentColor: '#16a34a' }, // Green
  { bgColor: '#fef2f2', textColor: '#7f1d1d', accentColor: '#dc2626' }, // Red
  { bgColor: '#faf5ff', textColor: '#581c87', accentColor: '#9333ea' }, // Purple
];

// Generate a creative placeholder image URL based on the search term and slide number
const getPlaceholderImageUrl = (searchTerm: string, index: number): string => {
  // Get a color based on theme
  const theme = slideThemes[index % slideThemes.length];
  const bgColor = theme.bgColor.replace('#', '');
  const textColor = theme.textColor.replace('#', '');
  
  // Generate a unique timestamp to avoid caching issues
  const timestamp = new Date().getTime();
  
  // Create a placeholder with the search term as text
  return `https://placehold.co/800x600/${bgColor}/${textColor}?text=${encodeURIComponent(searchTerm)}&t=${timestamp}`;
};

export default function Presentation({ slides }: PresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchedImages, setSearchedImages] = useState<Record<number, { url: string; alt: string; attribution?: { photographer: string; photographerUrl: string; source: string; sourceUrl: string }; thumbnails?: string[] }>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  
  // Search for an image on component mount for the first slide
  useEffect(() => {
    if (slides && slides.length > 0) {
      searchImageForSlide(0);
    }
  }, [slides]);
  
  // Add preloading effect to preload the next slide's image when a slide is shown
  useEffect(() => {
    // Preload next slide image if available
    if (slides && currentSlide < slides.length - 1) {
      const nextSlideIndex = currentSlide + 1;
      
      // If we haven't already tried to load this slide's image
      if (!searchedImages[nextSlideIndex] && !loading[nextSlideIndex]) {
        console.log(`Preloading image for next slide (${nextSlideIndex})`);
        // Use a small delay to not compete with the current slide's resources
        const timer = setTimeout(() => {
          searchImageForSlide(nextSlideIndex);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides, searchedImages, loading]);
  
  // Function to search for an image for a specific slide
  const searchImageForSlide = async (slideIndex: number) => {
    if (loading[slideIndex]) return;
    
    try {
      setLoading(prev => ({ ...prev, [slideIndex]: true }));
      setError(null);
      
      const searchTerm = slides[slideIndex].image;
      console.log(`Searching image for slide ${slideIndex}: "${searchTerm}"`);
      
      try {
        // Use our centralized image service API
        const response = await fetch('/api/image-service', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ searchTerm }),
        });
        
        if (!response.ok) {
          throw new Error('API request failed');
        }
        
        const data = await response.json();
        console.log(`Image service returned data for slide ${slideIndex}:`, data);
        
        // Store the image data
        setSearchedImages(prev => ({
          ...prev,
          [slideIndex]: {
            url: data.imageUrl,
            alt: data.alt || searchTerm,
            attribution: data.attribution,
            source: data.source,
            thumbnails: data.thumbnails || []
          }
        }));
      } catch (apiError) {
        console.error('API error, using placeholder:', apiError);
        // If the API fails, fallback to placeholder
        const placeholderUrl = getPlaceholderImageUrl(searchTerm, slideIndex);
        setSearchedImages(prev => ({
          ...prev,
          [slideIndex]: {
            url: placeholderUrl,
            alt: searchTerm,
            source: 'placeholder'
          }
        }));
      }
    } catch (err) {
      console.error('Error searching for image:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(prev => ({ ...prev, [slideIndex]: false }));
    }
  };
  
  // Refresh the current slide's image
  const refreshCurrentImage = () => {
    searchImageForSlide(currentSlide);
  };
  
  const goToNextSlide = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      
      // Search for an image for the next slide if we don't have one yet
      if (!searchedImages[nextSlide]) {
        searchImageForSlide(nextSlide);
      }
    }
  };
  
  const goToPrevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };
  
  const handleDownload = () => {
    // Create a PPT-like structure as HTML with slide templates
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Presentation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap');
        
        body {
          font-family: 'Inter', sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
        }
        
        .slide {
          width: 100%;
          height: 100vh;
          page-break-after: always;
          padding: 2rem;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        
        .slide-header {
          font-size: 2.5rem;
          margin-bottom: 2rem;
          text-align: center;
          font-weight: 700;
        }
        
        .slide-content {
          display: flex;
          flex-grow: 1;
          gap: 2rem;
        }
        
        .slide-points {
          flex: 1;
        }
        
        .slide-image {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .slide-image img {
          max-width: 100%;
          max-height: 400px;
          border-radius: 8px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        ul {
          font-size: 1.5rem;
          line-height: 1.6;
        }
        
        li {
          margin-bottom: 1rem;
        }
        
        @media print {
          .slide {
            page-break-after: always;
            height: 100vh;
          }
        }
      </style>
    </head>
    <body>`;
    
    slides.forEach((slide, index) => {
      const theme = slideThemes[index % slideThemes.length];
      // Use generated images if available, otherwise use placeholders
      const imageUrl = searchedImages[index]?.url || getPlaceholderImageUrl(slide.image, index);
      
      html += `
      <div class="slide" style="background-color: ${theme.bgColor}; color: ${theme.textColor};">
        <h1 class="slide-header" style="color: ${theme.accentColor};">${slide.heading}</h1>
        <div class="slide-content">
          <div class="slide-points">
            <ul>`;
      
      slide.points.forEach(point => {
        html += `<li>${point}</li>`;
      });
      
      html += `
            </ul>
          </div>
          <div class="slide-image">
            <img src="${imageUrl}" alt="${slide.image}">
          </div>
        </div>
      </div>`;
    });
    
    html += '</body></html>';
    
    // Create a Blob from the HTML
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  if (!slides || slides.length === 0) {
    return (
      <Alert>
        <AlertDescription>
          No slides to display. Please generate a presentation first.
        </AlertDescription>
      </Alert>
    );
  }
  
  const currentSlideData = slides[currentSlide];
  const googleImageUrl = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(currentSlideData.image)}`;
  const theme = slideThemes[currentSlide % slideThemes.length];
  
  // Generate placeholder image URL for the current slide
  const placeholderUrl = getPlaceholderImageUrl(currentSlideData.image, currentSlide);
  
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border shadow-lg" style={{backgroundColor: theme.bgColor}}>
        <CardHeader>
          <CardTitle className="text-2xl text-center" style={{color: theme.accentColor}}>
            {currentSlideData.heading}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium mb-4" style={{color: theme.textColor}}>Key Points</h3>
              <ul className="list-disc pl-5 space-y-2" style={{color: theme.textColor}}>
                {currentSlideData.points.map((point, index) => (
                  <li key={index} className="text-base">{point}</li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium" style={{color: theme.textColor}}>Image</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCurrentImage}
                  disabled={loading[currentSlide]}
                  className="flex items-center gap-1"
                >
                  {loading[currentSlide] ? (
                    <span>Loading...</span>
                  ) : (
                    <>
                      <RefreshCw size={14} />
                      Regenerate
                    </>
                  )}
                </Button>
              </div>
              <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
                <div className="w-full h-full flex items-center justify-center">
                  {loading[currentSlide] ? (
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-2"></div>
                      <span className="text-sm text-muted-foreground">Searching for image...</span>
                    </div>
                  ) : (
                    <img 
                      src={searchedImages[currentSlide]?.url || placeholderUrl}
                      alt={searchedImages[currentSlide]?.alt || currentSlideData.image}
                      className="object-cover w-full h-full"
                    />
                  )}
                </div>
              </AspectRatio>
              <div className="mt-2 text-center">
                {searchedImages[currentSlide]?.attribution ? (
                  <div className="text-xs text-muted-foreground flex flex-col items-center">
                    <span>
                      Photo by{' '}
                      <a 
                        href={searchedImages[currentSlide].attribution.photographerUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{color: theme.accentColor}}
                      >
                        {searchedImages[currentSlide].attribution.photographer}
                      </a>
                      {' '}on{' '}
                      <a 
                        href={searchedImages[currentSlide].attribution.sourceUrl}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{color: theme.accentColor}}
                      >
                        {searchedImages[currentSlide].attribution.source}
                      </a>
                    </span>
                  </div>
                ) : (
                  <a 
                    href={googleImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm flex items-center justify-center gap-1"
                    style={{color: theme.accentColor}}
                  >
                    <ExternalLink size={14} />
                    Find more images
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center justify-between p-4 border-t">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToPrevSlide}
              disabled={currentSlide === 0}
            >
              <ChevronLeft size={18} />
            </Button>
            <span className="text-sm" style={{color: theme.textColor}}>
              Slide {currentSlide + 1} of {slides.length}
            </span>
            <Button 
              variant="outline" 
              size="icon"
              onClick={goToNextSlide}
              disabled={currentSlide === slides.length - 1}
            >
              <ChevronRight size={18} />
            </Button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Download Presentation
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 