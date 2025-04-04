'use client';

import { useState } from 'react';

interface UsePdfParserResult {
  loading: boolean;
  error: string | null;
  parsedText: string | null;
  parsePdf: (file: File) => Promise<string>;
}

export function usePdfParser(): UsePdfParserResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState<string | null>(null);
  
  const parsePdf = async (file: File): Promise<string> => {
    setLoading(true);
    setError(null);
    
    return new Promise((resolve, reject) => {
      try {
        // In a real app, you would use a library like pdf.js
        // For this example, we're just simulating the extraction
        
        const reader = new FileReader();
        
        reader.onload = (event) => {
          // Simulate PDF parsing
          setTimeout(() => {
            // This is a dummy implementation
            const dummyText = `This is extracted content from ${file.name}. 
            In a real implementation, you would use a PDF parsing library like pdf.js.
            The parsed content would contain the actual text from the PDF document.`;
            
            setParsedText(dummyText);
            setLoading(false);
            resolve(dummyText);
          }, 1000); // Simulate parsing time
        };
        
        reader.onerror = () => {
          const errorMsg = 'Failed to read PDF file';
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        };
        
        reader.readAsArrayBuffer(file);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred while parsing PDF';
        setError(errorMsg);
        setLoading(false);
        reject(new Error(errorMsg));
      }
    });
  };
  
  return {
    loading,
    error,
    parsedText,
    parsePdf
  };
} 