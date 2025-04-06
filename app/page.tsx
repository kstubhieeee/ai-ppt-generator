'use client';

import { useState } from "react";
import PresentationForm from "@/components/PresentationForm";
import Presentation from "@/components/Presentation";
import PDFUpload from './components/PDFUpload';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "./components/ui/toast";
import { Slide } from "./types";

export default function Home() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [inputMethod, setInputMethod] = useState<'title' | 'content' | 'pdf'>('title');
  
  // Handle PDF text extraction completion
  const handlePDFTextExtracted = (text: string) => {
    setContent(text);
    setInputMethod('content');
    // Show a success message
    toast({
      title: "PDF Extracted Successfully",
      description: `Extracted ${text.length} characters of text. Ready to generate presentation.`,
    });
  };
  
  // Handle PDF extraction errors
  const handlePDFError = (errorMessage: string) => {
    setError(errorMessage);
    toast({
      variant: "destructive",
      title: "PDF Extraction Error",
      description: errorMessage,
    });
  };

  const handlePresentationGenerated = (generatedSlides: Slide[]) => {
    setSlides(generatedSlides);
    setIsGenerating(false);
  };

  const handleClear = () => {
    setTitle('');
    setContent('');
    setError(null);
    setInputMethod('title');
    setIsGenerating(false);
  };

  const handleGenerate = async () => {
    if (!title && !content) {
      setError('Please enter a title or content to generate slides');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // Make API call to generate slides
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          content: content,
          inputMethod: inputMethod
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate presentation');
      }
      
      const data = await response.json();
      
      // Set the generated slides
      handlePresentationGenerated(data.slides);
      
    } catch (error) {
      console.error('Error generating slides:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate presentation');
      setIsGenerating(false);
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="space-y-8 w-full max-w-4xl mx-auto px-4">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight">AI Presentation Generator</h1>
          <p className="text-muted-foreground">
            Generate professional presentations from a title, text, or PDF with AI.
          </p>
        </div>
        
        {error && (
          <Alert variant="destructive" className="my-4">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}
        
        <Card>
          <CardHeader>
            <CardTitle>Generate a Presentation</CardTitle>
            <CardDescription>Choose an input method below to create your presentation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs 
              defaultValue={inputMethod} 
              value={inputMethod}
              onValueChange={(value) => setInputMethod(value as 'title' | 'content' | 'pdf')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="title">From Title</TabsTrigger>
                <TabsTrigger value="content">From Text</TabsTrigger>
                <TabsTrigger value="pdf">From PDF</TabsTrigger>
              </TabsList>
              <TabsContent value="title" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Presentation Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter a descriptive title for your presentation"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <FormInfoText method="title" />
              </TabsContent>
              <TabsContent value="content" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Paste your text content here. The AI will extract key points and organize them into slides."
                    className="min-h-[200px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                <FormInfoText method="content" />
              </TabsContent>
              <TabsContent value="pdf" className="space-y-4 pt-4">
                <PDFUpload 
                  onTextExtracted={handlePDFTextExtracted}
                  onError={handlePDFError}
                />
                <FormInfoText method="pdf" />
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={handleClear}
              disabled={isGenerating}
            >
              Clear
            </Button>
            <Button 
              onClick={handleGenerate}
              disabled={isGenerating || (!title && !content)}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                'Generate Presentation'
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      {slides && (
        <div className="space-y-6 mt-8">
          <div className="flex justify-center">
            <button
              onClick={() => setSlides(null)}
              className="text-blue-500 underline"
            >
              Generate a new presentation
            </button>
          </div>
          <Presentation slides={slides} />
        </div>
      )}
    </main>
  );
}

// Helper component to display info text based on the current tab
function FormInfoText({ method }: { method: 'title' | 'content' | 'pdf' }) {
  const infoText = {
    title: "Enter a descriptive title and the AI will generate relevant slides about that topic.",
    content: "Paste text content and the AI will extract key points to create relevant slides.",
    pdf: "Upload a PDF document and the AI will extract text to generate your presentation."
  };
  
  return (
    <div className="text-sm text-muted-foreground">
      {infoText[method]}
    </div>
  );
}
