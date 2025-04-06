import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Helper function to ensure we always return JSON
const createJsonResponse = (data: any, status = 200) => {
  return new NextResponse(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

// API endpoint to extract text from PDF files
export async function POST(request: NextRequest) {
  console.log('PDF extraction API called');
  
  try {
    // Check content type - but be more lenient as some clients may not send proper multipart content type
    const contentType = request.headers.get('content-type') || '';
    console.log('Request content type:', contentType);
    
    if (!contentType.includes('multipart/form-data') && !contentType.includes('form-data')) {
      console.log('Warning: Content type may not be multipart form data');
      // Continue anyway as formData() will attempt to parse what it can
    }
    
    // Parse the form data from the request
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('Error parsing form data:', formError);
      return createJsonResponse({ 
        error: 'Failed to parse form data',
        details: formError instanceof Error ? formError.message : 'Unknown form parsing error'
      }, 400);
    }
    
    const pdfFile = formData.get('pdf') as File | null;
    
    if (!pdfFile) {
      console.log('No PDF file provided');
      return createJsonResponse({ error: 'No PDF file provided' }, 400);
    }
    
    console.log('Received file:', pdfFile.name, 'Size:', pdfFile.size, 'Type:', pdfFile.type);
    
    // Check file size
    if (pdfFile.size > MAX_FILE_SIZE) {
      console.log('File too large:', pdfFile.size);
      return createJsonResponse({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, 400);
    }
    
    // Check file type - be more lenient with type checking
    if (pdfFile.type && !pdfFile.type.includes('pdf')) {
      console.log('Warning: File type may not be PDF:', pdfFile.type);
      // Continue anyway and let pdf-parse determine if it can handle the file
    }
    
    try {
      // Convert the File to a Buffer
      let arrayBuffer;
      try {
        arrayBuffer = await pdfFile.arrayBuffer();
        console.log('File converted to array buffer, size:', arrayBuffer.byteLength);
      } catch (bufferError) {
        console.error('Error converting file to buffer:', bufferError);
        return createJsonResponse({ 
          error: 'Failed to process PDF file',
          details: bufferError instanceof Error ? bufferError.message : 'Unknown buffer error'
        }, 500);
      }
      
      const pdfBuffer = Buffer.from(arrayBuffer);
      
      // Parse the PDF
      console.log('Parsing PDF...');
      let result;
      try {
        result = await pdfParse(pdfBuffer);
      } catch (parseError) {
        console.error('Error parsing PDF content:', parseError);
        return createJsonResponse({ 
          error: 'Failed to parse PDF content',
          details: parseError instanceof Error ? parseError.message : 'The file may not be a valid PDF or may be corrupted'
        }, 422);
      }
      
      // Get the text content
      const textContent = result.text || '';
      console.log('Extracted text length:', textContent.length);
      
      if (textContent.length === 0) {
        console.log('Warning: No text extracted from PDF');
        return createJsonResponse({
          error: 'No text could be extracted from the PDF',
          details: 'The PDF may be scanned images or protected against text extraction'
        }, 422);
      }
      
      // Return the extracted text
      return createJsonResponse({
        text: textContent,
        pages: result.numpages,
        info: result.info
      });
    } catch (pdfError) {
      console.error('Error in PDF processing:', pdfError);
      return createJsonResponse({ 
        error: 'Failed to process PDF',
        details: pdfError instanceof Error ? pdfError.message : 'Unknown PDF processing error'
      }, 500);
    }
  } catch (error) {
    console.error('Unexpected error in PDF extraction API:', error);
    return createJsonResponse({ 
      error: 'Failed to extract text from PDF',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
}

// This is not needed in Next.js App Router - body size limits are set in next.config.mjs
// export const config = {
//   api: {
//     bodyParser: {
//       sizeLimit: '10mb',
//     },
//   },
// }; 