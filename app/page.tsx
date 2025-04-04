'use client';

import { useState } from "react";
import PresentationForm from "@/components/PresentationForm";
import Presentation from "@/components/Presentation";

export default function Home() {
  const [slides, setSlides] = useState<any[]>([]);
  const [generatedPresentation, setGeneratedPresentation] = useState(false);

  const handlePresentationGenerated = (generatedSlides: any[]) => {
    setSlides(generatedSlides);
    setGeneratedPresentation(true);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">AI PPT Generator</h1>
        <p className="text-gray-600 text-lg mb-6">Create beautiful presentations in seconds with AI</p>
      </div>

      {!generatedPresentation ? (
        <PresentationForm onPresentationGenerated={handlePresentationGenerated} />
      ) : (
        <div className="space-y-6">
          <div className="flex justify-center">
            <button
              onClick={() => setGeneratedPresentation(false)}
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
