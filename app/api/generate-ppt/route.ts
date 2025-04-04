import { NextRequest, NextResponse } from 'next/server';

// Use environment variable or fallback to the provided key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBmuGPpLhFgSNSsY273SLKBrVMGdMCuzKo';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface SlideContent {
  slide: number;
  heading: string;
  points: string[];
  image: string;
}

export async function POST(request: NextRequest) {
  try {
    const { inputType, content, title } = await request.json();
    
    // Format prompt based on input type
    let promptText = '';
    if (inputType === 'title') {
      promptText = `Create a presentation about "${content}" with a maximum of 4 slides.`;
    } else if (inputType === 'text') {
      promptText = `Create a presentation based on this text with a maximum of 4 slides: ${content}`;
    } else if (inputType === 'pdf') {
      // For PDF, the content would be extracted text
      promptText = `Create a presentation based on this PDF content with a maximum of 4 slides: ${content}`;
    }
    
    // Add specific instructions for the output format
    promptText += `\nFor each slide, provide:
    1. A clear heading/title
    2. 3-5 concise bullet points
    3. A simple, visually descriptive image search term (1-2 words, choose terms that would work well with stock photography)
    
    Format your response as a valid JSON array with objects containing: 
    [
      {
        "slide": (slide number),
        "heading": (slide title),
        "points": [(bullet points)],
        "image": (simple image search term)
      }
    ]
    
    Important: 
    - Your entire response must be valid JSON that I can parse directly
    - For the "image" field, provide simple visual concepts like "teamwork", "success", "technology", "nature", etc.
    - Choose image terms that will produce good results on Unsplash (professional stock photography site)
    - Keep image terms to 1-2 words maximum for best results`;

    // Log the prompt for debugging
    console.log('Sending prompt to Gemini:', promptText);

    // Send request to Gemini API - updated to match the correct API structure
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: promptText
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 2048
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      return NextResponse.json({ error: 'Failed to generate presentation content' }, { status: 500 });
    }

    const data = await response.json();
    
    try {
      // Extract the generated text from Gemini response
      const generatedText = data.candidates[0].content.parts[0].text;
      console.log('Gemini response text:', generatedText);
      
      // Try to parse the JSON directly first
      try {
        const parsedJson = JSON.parse(generatedText);
        if (Array.isArray(parsedJson)) {
          return NextResponse.json({ slides: parsedJson });
        }
      } catch (e) {
        console.error('Direct JSON parsing failed, trying fallback methods:', e);
      }
      
      // Extract the JSON data from the response text with fallback methods
      // This handles cases where the model might add markdown formatting or additional text
      let jsonMatch = generatedText.match(/```json\s*([\s\S]*?)\s*```/) || 
                     generatedText.match(/\[\s*{\s*"slide"/);
      
      let slideContent: SlideContent[] = [];
      
      if (jsonMatch) {
        // If we found JSON in markdown format or starting with an array bracket
        const jsonText = jsonMatch[1] || generatedText;
        try {
          // Find the start and end of the JSON array
          const startIndex = jsonText.indexOf('[');
          const endIndex = jsonText.lastIndexOf(']') + 1;
          
          if (startIndex !== -1 && endIndex !== -1) {
            const jsonArray = jsonText.substring(startIndex, endIndex);
            slideContent = JSON.parse(jsonArray);
          }
        } catch (e) {
          console.error('Error parsing JSON:', e);
        }
      }
      
      // Fallback parsing if the above methods fail
      if (slideContent.length === 0) {
        try {
          // Try to extract any JSON-like structures
          const regex = /\{[\s\S]*?"slide"[\s\S]*?\}/g;
          const matches = generatedText.match(regex);
          
          if (matches) {
            slideContent = matches.map((match: string) => {
              try {
                return JSON.parse(match);
              } catch (e) {
                // Clean up the match to make it valid JSON
                const cleanedMatch = match.replace(/'/g, '"')
                                         .replace(/(\w+):/g, '"$1":')
                                         .replace(/\n/g, '');
                return JSON.parse(cleanedMatch);
              }
            });
          }
        } catch (e) {
          console.error('Fallback parsing failed:', e);
        }
      }
      
      // If we still couldn't parse the JSON, return the error
      if (slideContent.length === 0) {
        return NextResponse.json({ 
          error: 'Failed to parse presentation content',
          rawResponse: generatedText 
        }, { status: 500 });
      }
      
      return NextResponse.json({ slides: slideContent });
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      return NextResponse.json({ 
        error: 'Failed to parse Gemini response',
        details: parseError instanceof Error ? parseError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 