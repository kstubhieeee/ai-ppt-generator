'use client';

import { useState, useEffect } from 'react';
import { Slide } from "@/app/types";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  RefreshCw,
  Copy,
  FileType,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";

// Add JSZip type declaration
declare global {
  interface Window {
    JSZip?: any;
  }
}

interface PresentationProps {
  slides: Slide[];
}

export default function Presentation({ slides }: PresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [searchedImages, setSearchedImages] = useState<Record<number, { url: string; alt: string; attribution?: { photographer: string; photographerUrl: string; source: string; sourceUrl: string }; source?: string; thumbnails?: string[] }>>({});
  const [loading, setLoading] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [selectedTheme, setSelectedTheme] = useState<string>("corporate");

  const currentSlideData = slides[currentSlide];
  const canGoBack = currentSlide > 0;
  const canGoForward = currentSlide < slides.length - 1;
  
  // Define professional presentation themes
  const presentationThemes = {
    corporate: {
      name: "Corporate",
      bgColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#0078d4',
      headerBg: '#f3f3f3',
      fontFamily: "'Segoe UI', sans-serif",
      slideGradient: 'linear-gradient(to bottom, #f9f9f9, #ffffff)',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
    },
    modern: {
      name: "Modern",
      bgColor: '#f5f5f7',
      textColor: '#1d1d1f',
      accentColor: '#0071e3',
      headerBg: '#ffffff',
      fontFamily: "'SF Pro Display', 'Helvetica Neue', sans-serif",
      slideGradient: 'linear-gradient(to right, #f5f5f7, #fafafa)',
      boxShadow: '0 10px 20px rgba(0, 0, 0, 0.08)'
    },
    dark: {
      name: "Dark",
      bgColor: '#1e1e1e',
      textColor: '#e0e0e0',
      accentColor: '#75ddff',
      headerBg: '#252525',
      fontFamily: "'Roboto', sans-serif",
      slideGradient: 'linear-gradient(to bottom, #252525, #1e1e1e)',
      boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)'
    },
    colorful: {
      name: "Colorful",
      bgColor: '#ffffff',
      textColor: '#333333',
      accentColor: '#ff5722',
      headerBg: '#ffebee',
      fontFamily: "'Poppins', sans-serif",
      slideGradient: 'linear-gradient(135deg, #fff9c4 0%, #ffffff 100%)',
      boxShadow: '0 6px 12px rgba(255, 87, 34, 0.1)'
    }
  };

  // Get current theme
  const theme = presentationThemes[selectedTheme as keyof typeof presentationThemes];

  // Function to search for an image for a specific slide
  const searchImageForSlide = async (slideIndex: number) => {
    if (loading[slideIndex]) return;
    
    try {
      setLoading(prev => ({ ...prev, [slideIndex]: true }));
      setError(null);
      
      const searchTerm = slides[slideIndex].image;
      console.log(`Searching image for slide ${slideIndex}: "${searchTerm}"`);
      
      try {
        // Use the image service API which will find the best available image
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

  // Load images for all slides when the component mounts or slides change
  useEffect(() => {
    if (slides && slides.length > 0) {
      console.log('Loading images for all slides...');
      // Pre-load images for all slides
      slides.forEach((_, index) => {
        // Use a small delay between requests to avoid overwhelming the server
        setTimeout(() => {
          // Only search for images that aren't already loaded
          if (!searchedImages[index]) {
            searchImageForSlide(index);
          }
        }, index * 300); // 300ms delay between each request
      });
    }
  }, [slides, searchedImages]);

  // Helper function to get placeholder image URL
  const getPlaceholderImageUrl = (term: string, index: number) => {
    // Use theme color for placeholder
    const bgColorHex = theme.bgColor.replace('#', '');
    const textColorHex = theme.textColor.replace('#', '');
    const timestamp = new Date().getTime();
    
    return `https://placehold.co/800x600/${bgColorHex}/${textColorHex}?text=${encodeURIComponent(term)}&t=${timestamp}`;
  };

  // Function to navigate to previous slide
  const prevSlide = () => {
    if (canGoBack) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  // Function to navigate to next slide
  const nextSlide = () => {
    if (canGoForward) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  // Function to regenerate the current slide's image
  const refreshCurrentImage = () => {
    searchImageForSlide(currentSlide);
  };

  // Function to handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      nextSlide();
    }
  };
  
  // Get placeholder image URL for current slide
  const placeholderUrl = getPlaceholderImageUrl(currentSlideData.image, currentSlide);
  
  // Get Google search URL for finding more images
  const googleImageUrl = `https://www.google.com/search?q=${encodeURIComponent(currentSlideData.image)}&tbm=isch`;

  // Function to download the presentation as HTML with more realistic PowerPoint styling
  const handleDownloadHTML = () => {
    const currentTheme = presentationThemes[selectedTheme as keyof typeof presentationThemes];
    
    // Create a PPT-like structure as HTML with slide templates
    let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Presentation</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Segoe+UI:wght@400;500;700&family=Roboto:wght@400;500;700&family=Poppins:wght@400;500;700&display=swap');
        
        body {
          font-family: ${currentTheme.fontFamily};
          margin: 0;
          padding: 0;
          color: ${currentTheme.textColor};
          background-color: #f0f0f0;
        }
        
        .slide-container {
          width: 1280px;
          height: 720px;
          margin: 2rem auto;
          overflow: hidden;
        }
        
        .slide {
          width: 1280px;
          height: 720px;
          page-break-after: always;
          padding: 0;
          box-sizing: border-box;
          background: ${currentTheme.slideGradient};
          box-shadow: ${currentTheme.boxShadow};
          position: relative;
          overflow: hidden;
        }
        
        .slide-header {
          background-color: ${currentTheme.headerBg};
          padding: 40px 60px 20px;
          position: relative;
        }
        
        .slide-title {
          font-size: 44px;
          margin: 0;
          color: ${currentTheme.accentColor};
          font-weight: 700;
        }
        
        .slide-content {
          display: flex;
          padding: 20px 60px 40px;
          height: calc(100% - 120px);
        }
        
        .slide-points {
          flex: 1;
          padding-right: 40px;
        }
        
        .slide-image {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
        }
        
        .slide-image img {
          max-width: 100%;
          max-height: 500px;
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .points-list {
          margin: 0;
          padding: 0;
          list-style-type: none;
        }
        
        .points-list li {
          margin-bottom: 24px;
          font-size: 28px;
          line-height: 1.4;
          position: relative;
          padding-left: 40px;
        }
        
        .points-list li:before {
          content: "";
          position: absolute;
          left: 0;
          top: 14px;
          width: 12px;
          height: 12px;
          background-color: ${currentTheme.accentColor};
          border-radius: 50%;
        }
        
        .slide-number {
          position: absolute;
          bottom: 20px;
          right: 20px;
          font-size: 16px;
          color: ${currentTheme.textColor}80;
        }
        
        .footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 16px;
          background-color: ${currentTheme.accentColor};
        }
        
        @media print {
          body { background-color: white; }
          .slide-container { margin: 0; }
          .slide {
            page-break-after: always;
            margin: 0;
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>`;
    
    slides.forEach((slide, index) => {
      // Use generated images if available, otherwise use placeholders
      const imageUrl = searchedImages[index]?.url || getPlaceholderImageUrl(slide.image, index);
      
      html += `
      <div class="slide-container">
        <div class="slide">
          <div class="slide-header">
            <h1 class="slide-title">${slide.heading}</h1>
          </div>
          <div class="slide-content">
            <div class="slide-points">
              <ul class="points-list">`;
      
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
          <div class="slide-number">Slide ${index + 1} / ${slides.length}</div>
          <div class="footer"></div>
        </div>
      </div>`;
    });
    
    html += '</body></html>';
    
    // Create a Blob with the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Create a download link and trigger it
    const a = document.createElement('a');
    a.href = url;
    a.download = 'presentation.html';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Function to download presentation as PPTX data using client-side approach
  const handleDownloadPPTX = () => {
    // Create a PowerPoint-like XML format
    const pptContent = `
    <html xmlns:v="urn:schemas-microsoft-com:vml"
    xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:p="urn:schemas-microsoft-com:office:powerpoint"
    xmlns:oa="urn:schemas-microsoft-com:office:activation"
    xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta http-equiv=Content-Type content="text/html; charset=utf-8">
      <meta name=ProgId content=PowerPoint.Slide>
      <meta name=Generator content="Microsoft PowerPoint">
      <style>
        /* PowerPoint styles would go here */
        div.slide { page-break-after: always }
      </style>
    </head>
    <body>
    ${slides.map((slide, index) => {
      const imageUrl = searchedImages[index]?.url || getPlaceholderImageUrl(slide.image, index);
      return `
      <div class="slide">
        <h1>${slide.heading}</h1>
        <ul>
          ${slide.points.map(point => `<li>${point}</li>`).join('')}
        </ul>
        <img src="${imageUrl}" alt="${slide.image}" width="400">
      </div>
      `;
    }).join('')}
    </body>
    </html>
    `;
    
    // Create a simple text instruction file to accompany the HTML file
    const instructionText = `
    ==========================================
    POWERPOINT PRESENTATION - CONVERSION GUIDE
    ==========================================
    
    To convert this to a PowerPoint presentation:
    
    1. Open the provided HTML file in Microsoft Word
    2. Use File > Save As and select PowerPoint format (.pptx)
    3. Word will convert the file to PowerPoint format
    
    Alternative method:
    1. Open PowerPoint
    2. Create a new presentation
    3. Go to Home > New Slide > Slides from Outline
    4. Select the .html file
    
    Note: Some manual formatting may be required after conversion.
    ==========================================
    `;
    
    // Create a zip file with both files
    const zip = window.JSZip ? new window.JSZip() : null;
    
    if (zip) {
      // Add files to zip
      zip.file("presentation.html", pptContent);
      zip.file("conversion_instructions.txt", instructionText);
      
      // Generate the zip file
      zip.generateAsync({type:"blob"}).then(function(content: Blob) {
        // Create download link
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'presentation_package.zip';
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
      });
    } else {
      // Fallback to just HTML if JSZip not available
      alert("PPTX download requires JSZip library. HTML download initiated instead.");
      handleDownloadHTML();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Add JSZip library from CDN */}
      <script 
        src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" 
        integrity="sha512-XMVd28F1oH/O71fzwBnV7HucLxVwtxf26XV8P4wPk26EDxuGZ91N8bsOttmnomcCD3CS5ZMRL50H0GgOHvegtg==" 
        crossOrigin="anonymous" 
        referrerPolicy="no-referrer"
      />

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">Presentation Preview</h2>
        <div className="flex gap-2">
          <select 
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="px-2 py-1 border rounded text-sm"
          >
            {Object.entries(presentationThemes).map(([key, theme]) => (
              <option key={key} value={key}>{theme.name}</option>
            ))}
          </select>
        </div>
      </div>
      
      <Card 
        className="border shadow-lg overflow-hidden" 
        style={{
          backgroundColor: theme.bgColor,
          fontFamily: theme.fontFamily,
          background: theme.slideGradient,
          boxShadow: theme.boxShadow
        }}
      >
        <CardHeader style={{backgroundColor: theme.headerBg, padding: '2rem 2.5rem 1.5rem'}}>
          <CardTitle 
            className="text-3xl" 
            style={{color: theme.accentColor, fontWeight: 700}}
          >
            {currentSlideData.heading}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 
                className="text-xl font-medium mb-4" 
                style={{color: theme.textColor}}
              >
                Key Points
              </h3>
              <ul className="space-y-4 pl-0" style={{color: theme.textColor}}>
                {currentSlideData.points.map((point, index) => (
                  <li 
                    key={index} 
                    className="flex items-start" 
                    style={{fontSize: '1.1rem', lineHeight: 1.5}}
                  >
                    <div 
                      className="mr-3 mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" 
                      style={{backgroundColor: theme.accentColor}} 
                    />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 
                  className="text-xl font-medium" 
                  style={{color: theme.textColor}}
                >
                  Image
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshCurrentImage}
                  disabled={loading[currentSlide]}
                  className="flex items-center gap-1"
                  style={{borderColor: theme.accentColor, color: theme.accentColor}}
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
              
              <AspectRatio 
                ratio={4/3} 
                className="overflow-hidden rounded-md"
                style={{boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
              >
                <div className="w-full h-full flex items-center justify-center">
                  {loading[currentSlide] ? (
                    <div className="flex flex-col items-center justify-center">
                      <div 
                        className="animate-spin rounded-full h-10 w-10 border-b-2 mb-2"
                        style={{borderColor: theme.accentColor}}
                      />
                      <span className="text-sm" style={{color: theme.textColor}}>
                        Searching for image...
                      </span>
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
                  <div className="text-xs flex flex-col items-center" style={{color: `${theme.textColor}80`}}>
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
        
        <div 
          className="h-2 w-full" 
          style={{backgroundColor: theme.accentColor}}
        />
        
        <CardFooter 
          className="p-6 flex justify-between" 
          tabIndex={0} 
          onKeyDown={handleKeyDown}
        >
          <div className="flex items-center">
            <Button
              variant="outline"
              onClick={prevSlide}
              disabled={!canGoBack}
              className="gap-1 mr-2"
              style={canGoBack ? {borderColor: theme.accentColor, color: theme.accentColor} : {}}
            >
              <ChevronLeft size={16} /> Previous
            </Button>
            <Button
              variant="outline"
              onClick={nextSlide}
              disabled={!canGoForward}
              className="gap-1"
              style={canGoForward ? {borderColor: theme.accentColor, color: theme.accentColor} : {}}
            >
              Next <ChevronRight size={16} />
            </Button>
          </div>
          
          <div className="dropdown relative">
            <Button
              variant="default"
              style={{backgroundColor: theme.accentColor, color: '#ffffff'}}
              className="gap-1 dropdown-toggle"
            >
              <Download size={16} /> Download
            </Button>
            <div className="dropdown-menu absolute right-0 mt-2 bg-white shadow-lg rounded p-2 z-10 hidden">
              <Button
                variant="ghost"
                onClick={handleDownloadHTML}
                className="w-full justify-start text-sm mb-1"
              >
                <FileType size={14} className="mr-2" /> HTML Presentation
              </Button>
              <Button
                variant="ghost"
                onClick={handleDownloadPPTX}
                className="w-full justify-start text-sm"
              >
                <Copy size={14} className="mr-2" /> PowerPoint Format
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
      
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-200 ${
                index === currentSlide
                  ? "scale-125"
                  : "opacity-60 hover:opacity-100"
              }`}
              style={{
                backgroundColor: index === currentSlide 
                  ? theme.accentColor 
                  : `${theme.accentColor}80`
              }}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <script dangerouslySetInnerHTML={{
        __html: `
          // Show dropdown menu on click
          document.addEventListener('DOMContentLoaded', function() {
            const toggle = document.querySelector('.dropdown-toggle');
            const menu = document.querySelector('.dropdown-menu');
            
            if (toggle && menu) {
              toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                menu.classList.toggle('hidden');
              });
              
              document.addEventListener('click', function() {
                menu.classList.add('hidden');
              });
            }
          });
        `
      }} />
    </div>
  );
} 