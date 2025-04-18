# AI PPT Generator

A web application that uses Google's Gemini 2.0 API to generate PowerPoint-style presentations from titles, text content, or PDF files.

## Features

- Generate presentations from a title, text content, or PDF files
- Maximum of 4 slides per presentation
- Each slide includes a heading, bullet points, and relevant images
- High-quality images from Pexels API with proper attribution
- AI-generated images using Google Gemini when stock photos aren't available
- PDF text extraction for easy content import
- Download the generated presentation as an HTML file that can be printed or converted to PDF
- Modern, responsive UI built with Next.js and Shadcn UI

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/ai-ppt-generator.git
cd ai-ppt-generator
```

2. Install dependencies
```bash
npm install --legacy-peer-deps
# or
yarn install --legacy-peer-deps
```

3. Create a `.env.local` file in the root directory and add your API keys:
```
# Gemini API key for AI text and image generation
GEMINI_API_KEY=your_gemini_api_key_here

# Pexels API key for high-quality stock images
PEXELS_API_KEY=your_pexels_api_key_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Choose an input method:
   - Enter a title
   - Paste text content
   - Upload a PDF file (up to 10MB)
2. Click "Generate Presentation"
3. View the generated slides with navigation controls
4. Regenerate images if needed using the refresh button
5. Download the presentation as an HTML file
6. Print or convert the HTML file to PDF if needed

## Image Sources

The application uses a tiered approach to find the best images for your slides:

1. **Pexels Stock Photos**: High-quality, curated images with proper attribution
2. **Google Gemini**: AI-generated images created specifically for your content
3. **Placeholder Images**: Fallback option when other sources are unavailable

## PDF Extraction

The PDF extraction feature allows you to quickly import content from:
- Research papers
- Reports
- Articles
- Any PDF document up to 10MB

## Limitations

- PDF extraction works best with text-based PDFs rather than scanned documents
- Image generation quality depends on the availability of relevant stock photos
- Presentation style is basic HTML/CSS, not a full PowerPoint/PPTX file

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Google Gemini API](https://ai.google.dev/gemini-api) - AI text and image generation
- [Pexels API](https://www.pexels.com/api/) - Stock photos
- [pdf-parse](https://www.npmjs.com/package/pdf-parse) - PDF text extraction

## Gemini Image Generation

This application now supports AI-generated images using Google's Gemini API:

1. Sign up for a Gemini API key at [Google AI Studio](https://ai.google.dev/)
2. Copy your API key
3. Create a `.env.local` file in the root directory
4. Add your API key to the file: `GEMINI_API_KEY=your_api_key_here`

With a valid API key, the application will generate unique images for each slide. If no API key is provided, it will fall back to placeholder images.

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
