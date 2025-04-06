'use client';

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Slide } from "@/app/types";

interface PresentationFormProps {
  onPresentationGenerated: (slides: Slide[]) => void;
}

// This component is kept for backward compatibility but is no longer the primary way to generate presentations
export default function PresentationForm({
  onPresentationGenerated,
}: PresentationFormProps) {
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    setIsLoading(true);
    
    try {
      // Call the same API that the main page uses
      const response = await fetch('/api/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: title,
          content: "",
          inputMethod: "title"
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate presentation');
      }
      
      const data = await response.json();
      onPresentationGenerated(data.slides);
    } catch (error) {
      console.error('Error generating presentation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Legacy Form</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter presentation title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!title || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Presentation...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
} 