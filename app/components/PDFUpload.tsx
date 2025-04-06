'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, Upload, FileText } from 'lucide-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PDFUploadProps {
  onTextExtracted: (text: string) => void;
  onError: (error: string) => void;
}

export default function PDFUpload({ onTextExtracted, onError }: PDFUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{ name: string; size: string } | null>(null);
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Clear any previous file
      setFile(null);
      setFileInfo(null);
      
      // Check if file is a PDF
      if (selectedFile.type !== 'application/pdf') {
        onError('Please select a PDF file');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        onError('File size exceeds 10MB limit');
        return;
      }
      
      setFile(selectedFile);
      setFileInfo({
        name: selectedFile.name,
        size: formatFileSize(selectedFile.size)
      });
    }
  };
  
  // Extract text from PDF
  const handleExtractText = async () => {
    if (!file) {
      onError('Please select a PDF file first');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('pdf', file);
      
      console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
      
      // Send to our PDF extraction API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      let response;
      try {
        response = await fetch('/api/extract-pdf', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          // Set appropriate headers for form data
          headers: {
            // Do not set Content-Type manually - browser will set it with boundary for multipart/form-data
          },
        });
        
        clearTimeout(timeoutId);
      } catch (fetchError) {
        if (fetchError instanceof DOMException && fetchError.name === 'AbortError') {
          throw new Error('Request timed out. The server took too long to respond.');
        }
        throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Failed to connect to server'}`);
      }
      
      // Always try to parse response as text first to diagnose issues
      let responseText;
      try {
        responseText = await response.text();
        console.log('Response received, length:', responseText.length);
      } catch (textError) {
        throw new Error(`Failed to read response: ${textError instanceof Error ? textError.message : 'Unknown error'}`);
      }
      
      // Try parsing as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Response is not valid JSON:', responseText.substring(0, 500));
        throw new Error('The server returned an invalid response format. Please try again or contact support.');
      }
      
      if (!response.ok) {
        throw new Error(data.error || data.details || `Server error: ${response.status}`);
      }
      
      if (!data.text) {
        throw new Error(data.error || 'No text was extracted from the PDF. The file might be scanned or contain only images.');
      }
      
      onTextExtracted(data.text);
      
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      onError(error instanceof Error ? error.message : 'An error occurred processing the PDF');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/40 hover:bg-muted/60">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {fileInfo ? (
                  <div className="flex flex-col items-center text-center">
                    <FileText className="w-8 h-8 mb-2 text-primary" />
                    <p className="mb-1 text-sm text-muted-foreground">
                      <span className="font-semibold">{fileInfo.name}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{fileInfo.size}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center">
                    <Upload className="w-8 h-8 mb-2 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PDF files only (max 10MB)</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                accept=".pdf" 
                className="hidden" 
                onChange={handleFileChange} 
                disabled={isUploading}
              />
            </label>
          </div>
          
          <Button 
            onClick={handleExtractText} 
            disabled={!file || isUploading} 
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Extracting Text...
              </>
            ) : (
              'Extract Text from PDF'
            )}
          </Button>
          
          {isUploading && (
            <Alert>
              <AlertDescription>
                Processing PDF... this may take a moment depending on the size of the document.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 