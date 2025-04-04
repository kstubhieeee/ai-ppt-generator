'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FileText, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePdfParser } from '@/hooks/usePdfParser';

type InputType = 'title' | 'text' | 'pdf';

interface PresentationFormProps {
  onPresentationGenerated: (slides: any) => void;
}

export default function PresentationForm({ onPresentationGenerated }: PresentationFormProps) {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { parsePdf, loading: pdfLoading } = usePdfParser();
  
  const handleSubmit = async (type: InputType) => {
    setError(null);
    setLoading(true);
    
    try {
      let content = '';
      
      // Get content based on input type
      if (type === 'title') {
        if (!title.trim()) {
          throw new Error('Please enter a title for your presentation');
        }
        content = title;
      } else if (type === 'text') {
        if (!text.trim()) {
          throw new Error('Please enter some text for your presentation');
        }
        content = text;
      } else if (type === 'pdf') {
        if (!file) {
          throw new Error('Please upload a PDF file');
        }
        
        // Extract text from PDF using our custom hook
        content = await parsePdf(file);
      }
      
      // Call the API to generate presentation
      const response = await fetch('/api/generate-ppt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputType: type,
          content,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate presentation');
      }
      
      const data = await response.json();
      
      if (!data.slides || data.slides.length === 0) {
        throw new Error('No presentation content was generated');
      }
      
      onPresentationGenerated(data.slides);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      console.error('Error generating presentation:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
    } else if (selectedFile) {
      setError('Please upload a PDF file');
      e.target.value = '';
    }
  };
  
  const isSubmitDisabled = (type: InputType) => {
    if (loading || pdfLoading) return true;
    if (type === 'title') return !title.trim();
    if (type === 'text') return !text.trim();
    if (type === 'pdf') return !file;
    return false;
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <Tabs defaultValue="title">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="title">Title</TabsTrigger>
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="pdf">PDF</TabsTrigger>
          </TabsList>
          
          <TabsContent value="title" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Presentation Title</Label>
              <Input 
                id="title" 
                placeholder="Enter a title for your presentation" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <Button 
              onClick={() => handleSubmit('title')} 
              disabled={isSubmitDisabled('title')}
              className="w-full"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Presentation'}
            </Button>
          </TabsContent>
          
          <TabsContent value="text" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="text">Presentation Content</Label>
              <Textarea 
                id="text" 
                placeholder="Enter the content for your presentation" 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-32"
              />
            </div>
            <Button 
              onClick={() => handleSubmit('text')} 
              disabled={isSubmitDisabled('text')}
              className="w-full"
            >
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : 'Generate Presentation'}
            </Button>
          </TabsContent>
          
          <TabsContent value="pdf" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="pdf">Upload PDF</Label>
              <div className="border rounded-md p-4 flex flex-col items-center justify-center gap-2">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Upload a PDF file to generate presentation</p>
                <Input 
                  id="pdf" 
                  type="file" 
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="max-w-xs"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">Selected file: {file.name}</p>
              )}
            </div>
            <Button 
              onClick={() => handleSubmit('pdf')} 
              disabled={isSubmitDisabled('pdf')}
              className="w-full"
            >
              {loading || pdfLoading ? 
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {pdfLoading ? 'Parsing PDF...' : 'Generating...'}</> : 
                'Generate Presentation'
              }
            </Button>
          </TabsContent>
        </Tabs>
        
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
} 