# AI PPT Generator

A web application that uses Google's Gemini 2.0 API to generate PowerPoint-style presentations from titles, text content, or PDF files.

## Features

- Generate presentations from a title, text content, or PDF
- Maximum of 4 slides per presentation
- Each slide includes a heading, bullet points, and relevant images
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
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

4. Start the development server
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Usage

1. Enter a title, paste text content, or upload a PDF file
2. Click "Generate Presentation"
3. View the generated slides with navigation controls
4. Download the presentation as an HTML file
5. Print or convert the HTML file to PDF if needed

## Limitations

- PDF parsing is simulated in this demo. In a production environment, you would use a PDF parsing library like pdf.js
- Image suggestions are based on search queries, not actual image generation
- Presentation style is basic HTML/CSS

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn UI](https://ui.shadcn.com/) - UI components
- [Google Gemini API](https://ai.google.dev/gemini-api) - AI text generation

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
