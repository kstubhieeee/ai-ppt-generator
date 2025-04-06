import { NextRequest, NextResponse } from 'next/server';
import { Slide } from '@/app/types';

// OpenRouter API key should be in environment variables
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { title, content, inputMethod } = await request.json();
    
    if (!title && !content) {
      return NextResponse.json({ 
        error: 'Either title or content is required' 
      }, { status: 400 });
    }
    
    console.log(`Generating slides from ${inputMethod}. Title: "${title || 'None'}", Content length: ${content?.length || 0}`);
    
    // Check if OpenRouter API key is available
    if (!OPENROUTER_API_KEY) {
      console.warn('OpenRouter API key not found, falling back to local processing');
      // Process the input to generate slides without API
      const slides = await generateLocalSlides(title, content, inputMethod);
      return NextResponse.json({ slides });
    }
    
    try {
      // Build the prompt based on the input method
      let prompt = '';
      if (inputMethod === 'title' && title) {
        prompt = `Create a presentation about "${title}". Generate a JSON response with slides. Each slide should have a heading, 3-5 bullet points, and an image description. The first slide should be an introduction, and the last slide should be a conclusion. Make the content informative and professional.`;
      } else if (content) {
        prompt = `Analyze the following content and create a presentation based on it. Extract key information and organize it into a coherent presentation structure. Generate a JSON response with slides. Each slide should have a heading, 3-5 bullet points, and an image description.

Content to analyze:
${content.substring(0, 7000)}

The JSON should follow this format:
{
  "slides": [
    {
      "heading": "Slide Title",
      "points": ["Point 1", "Point 2", "Point 3"],
      "imageDescription": "Brief description for image search"
    }
  ]
}
`;
      }
      
      // Call OpenRouter API
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "AI Presentation Generator",
          },
          body: JSON.stringify({
            model: "mistralai/mixtral-8x7b-instruct",
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4000,
            response_format: { type: "json_object" },
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`);
      }
      
      const data = await response.json();
      const responseContent = data.choices[0].message.content;
      
      // Parse the content as JSON
      let slideData;
      try {
        slideData = JSON.parse(responseContent);
      } catch (parseError) {
        console.error('Error parsing JSON from API:', parseError);
        throw new Error('Failed to parse AI response');
      }
      
      // Convert the API response to our Slide format
      const slides: Slide[] = [];
      
      if (slideData && slideData.slides && Array.isArray(slideData.slides)) {
        slideData.slides.forEach((slide: any, index: number) => {
          slides.push({
            slide: index + 1,
            heading: slide.heading || `Slide ${index + 1}`,
            points: Array.isArray(slide.points) ? slide.points : [],
            image: slide.imageDescription || slide.heading || `Slide ${index + 1}`
          });
        });
      } else {
        throw new Error('Invalid response format from AI');
      }
      
      // Limit to 4 slides maximum for this demo
      return NextResponse.json({ slides: slides.slice(0, 4) });
      
    } catch (apiError) {
      console.error('Error with OpenRouter API:', apiError);
      // Fall back to local processing if API fails
      const slides = await generateLocalSlides(title, content, inputMethod);
      return NextResponse.json({ slides });
    }
    
  } catch (error) {
    console.error('Error generating slides:', error);
    return NextResponse.json({ 
      error: 'Failed to generate slides',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Function to generate slides locally without API (fallback)
async function generateLocalSlides(title: string, content: string, inputMethod: string): Promise<Slide[]> {
  // Initialize slides array
  const slides: Slide[] = [];
  
  if (inputMethod === 'title' && title) {
    // If only title is provided, create a basic presentation
    slides.push({
      slide: 1,
      heading: title,
      points: [
        "Introduction to " + title,
        "Key concepts and definitions",
        "Overview of main topics"
      ],
      image: title
    });
    
    slides.push({
      slide: 2,
      heading: "Key Points",
      points: [
        "Main point 1 about " + title,
        "Main point 2 about " + title,
        "Main point 3 about " + title
      ],
      image: title + " key points"
    });
    
    slides.push({
      slide: 3,
      heading: "Conclusion",
      points: [
        "Summary of " + title,
        "Future directions",
        "Questions and discussion"
      ],
      image: title + " conclusion"
    });
  } 
  else if (content) {
    // Parse content to extract sections and points
    const parsedContent = parseContent(content);
    
    // Create title slide
    slides.push({
      slide: 1,
      heading: title || parsedContent.title || "Presentation",
      points: [
        parsedContent.introduction || "Introduction",
        "Key topics covered",
        parsedContent.author || "Generated from content"
      ],
      image: parsedContent.title || title || "presentation"
    });
    
    // Create slides for each section
    parsedContent.sections.forEach((section, index) => {
      slides.push({
        slide: index + 2,
        heading: section.heading,
        points: section.points.slice(0, 5), // Limit to 5 points per slide
        image: section.heading
      });
    });
    
    // Add a conclusion slide if we have enough content
    if (parsedContent.sections.length > 0) {
      slides.push({
        slide: parsedContent.sections.length + 2,
        heading: "Summary",
        points: [
          "Key takeaways",
          ...(parsedContent.sections.length > 0 
              ? parsedContent.sections.slice(0, 3).map(s => s.heading)
              : ["Main points from the presentation"])
        ],
        image: "summary"
      });
    }
  }
  
  // Ensure we have at least one slide
  if (slides.length === 0) {
    slides.push({
      slide: 1,
      heading: title || "Presentation",
      points: [
        "No content was provided",
        "Please add more details to generate a complete presentation",
        "You can edit this slide"
      ],
      image: "empty presentation"
    });
  }
  
  // Limit to 4 slides maximum for this demo
  return slides.slice(0, 4);
}

// Define return type for parseContent function
interface ParsedContent {
  title?: string;
  introduction?: string;
  author?: string;
  sections: Array<{
    heading: string;
    points: string[];
  }>;
}

// Helper function to parse content into structured sections
function parseContent(content: string): ParsedContent {
  // Initialize result
  const result: ParsedContent = {
    title: undefined,
    introduction: undefined,
    author: undefined,
    sections: []
  };
  
  // Split content into lines
  const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
  
  // Try to find a title in the first few lines
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    if (line.length > 0 && line.length < 100 && !line.endsWith('.')) {
      result.title = line;
      break;
    }
  }
  
  // Look for potential sections in the content
  let currentSection: { heading: string; points: string[] } | null = null;
  
  lines.forEach(line => {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (trimmedLine === '') return;
    
    // Check if this looks like a heading
    const isHeading = (
      // Less than 100 chars
      trimmedLine.length < 100 && 
      // Not ending with period (likely not a sentence)
      !trimmedLine.endsWith('.') &&
      // Has some capitalization or is all caps
      (trimmedLine[0] === trimmedLine[0].toUpperCase() || 
       trimmedLine === trimmedLine.toUpperCase())
    );
    
    if (isHeading) {
      // If we already have a section, add it to our result
      if (currentSection && currentSection.points.length > 0) {
        result.sections.push(currentSection);
      }
      
      // Start a new section
      currentSection = {
        heading: trimmedLine,
        points: []
      };
    } 
    else if (currentSection) {
      // Add point to current section if it looks like a proper sentence or bullet point
      const cleanLine = trimmedLine.replace(/^[-•*]\s*/, '').trim();
      if (cleanLine.length > 15 && cleanLine.length < 200) {
        currentSection.points.push(cleanLine);
      }
    }
    else {
      // If we don't have a section yet, this might be introduction text
      if (!result.introduction && trimmedLine.length > 20) {
        result.introduction = trimmedLine.substring(0, 150) + (trimmedLine.length > 150 ? '...' : '');
      }
    }
  });
  
  // Add the last section if we have one
  if (currentSection && currentSection.points.length > 0) {
    result.sections.push(currentSection);
  }
  
  // If we didn't find proper sections, create sections from paragraphs
  if (result.sections.length === 0) {
    const paragraphs = content.split(/\n\s*\n/);
    
    paragraphs.forEach((para, index) => {
      // Skip very short paragraphs
      if (para.trim().length < 30) return;
      
      // Extract the first sentence as a potential heading
      const firstSentenceMatch = para.match(/^([^.!?]+[.!?])\s*([\s\S]*)/);
      
      if (firstSentenceMatch) {
        const heading = firstSentenceMatch[1].trim();
        const remainingText = firstSentenceMatch[2].trim();
        
        // Create points from remaining sentences
        const points = remainingText
          .split(/[.!?]+\s+/)
          .filter(s => s.trim().length > 15 && s.trim().length < 200)
          .map(s => s.trim())
          .slice(0, 5);
        
        // Make sure we have at least one point
        const sectionPoints: string[] = points.length > 0 
          ? points 
          : [remainingText.substring(0, 150) + '...'];
        
        const newSection: { heading: string; points: string[] } = {
          heading: heading.replace(/[.!?]+$/, ''),
          points: sectionPoints
        };
        
        result.sections.push(newSection);
      }
    });
  }
  
  // If we still have no sections, create generic ones based on the content
  if (result.sections.length === 0) {
    const contentChunks = splitIntoChunks(content, 500);
    
    contentChunks.forEach((chunk, index) => {
      const sentences = chunk
        .split(/[.!?]+\s+/)
        .filter(s => s.trim().length > 0);
      
      if (sentences.length > 0) {
        // Use first short sentence as heading, or create a generic one
        let heading = sentences[0].trim();
        if (heading.length > 50) {
          heading = `Section ${index + 1}`;
        }
        
        // Use remaining sentences as points
        const points = sentences
          .slice(1)
          .filter(s => s.trim().length > 15 && s.trim().length < 200)
          .map(s => s.trim())
          .slice(0, 5);
        
        // Ensure we have at least one point to avoid empty points array
        const sectionPoints: string[] = points.length > 0 
          ? points 
          : ["Key information for this section"];
        
        const newSection: { heading: string; points: string[] } = {
          heading,
          points: sectionPoints
        };
        
        result.sections.push(newSection);
      }
    });
  }
  
  return result;
}

// Helper function to split content into chunks
function splitIntoChunks(text: string, chunkSize: number): string[] {
  const chunks = [];
  let startIndex = 0;
  
  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    chunks.push(text.substring(startIndex, endIndex));
    startIndex = endIndex;
  }
  
  return chunks;
} 