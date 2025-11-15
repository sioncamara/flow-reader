# FlowReader

A modern PDF reader with integrated text-to-speech capabilities. FlowReader allows you to read PDFs with synchronized word-by-word highlighting and customizable voice settings, making it an excellent alternative to NaturalReader.

🌐 **Try it live**: [flowreaders.com/library](https://www.flowreaders.com/library)

## Features

- 📖 **PDF Reading**: View PDFs with smooth virtual scrolling for optimal performance
- 🔊 **Text-to-Speech**: Built-in text-to-speech with word-by-word highlighting
- 🎤 **Voice Selection**: Choose from available system voices with multi-language support
- ⚡ **Reading Speed Control**: Adjustable reading rate (0.5x - 2.0x)
- 📚 **Library Management**: Store and manage your PDF collection locally using IndexedDB
- 🔖 **Table of Contents**: Navigate PDFs using built-in table of contents when available
- 💾 **Reading Position**: Automatically saves your reading position for each PDF
- 🎯 **Smart Navigation**: Double-click any word to start reading from that position
- 🌍 **Multi-language Support**: Supports 70+ languages for text-to-speech
- ⌨️ **Keyboard Shortcuts**: Press Space to play/pause reading

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **PDF Rendering**: PDF.js (react-pdf)
- **Text-to-Speech**: Web Speech API
- **State Management**: Zustand
- **Storage**: IndexedDB (idb)
- **UI Components**: Radix UI
- **Virtual Scrolling**: react-window

## Prerequisites

- Node.js 18+ (or higher)
- pnpm (recommended) or npm/yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd FlowReader
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
# or
yarn install
```

## Development

Run the development server:

```bash
pnpm dev
# or
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

1. **Adding PDFs**: 
   - Navigate to the library page (or `/add-pdf` if your library is empty)
   - Drag and drop a PDF file or use the file uploader
   - The PDF will be automatically stored in your browser's IndexedDB

2. **Reading**:
   - Click on any PDF cover in your library to open it
   - Double-click on any word in the PDF to start text-to-speech from that position
   - Use the play/pause button or press Space to control playback
   - Adjust reading speed using the +/- buttons or hover over the speed indicator for a slider
   - Select different voices from the voice dropdown

3. **Navigation**:
   - Scroll through pages normally
   - If the PDF has a table of contents, hover over the TOC icon in the top-right corner
   - Your reading position is automatically saved and restored when you return

## Project Structure

```
FlowReader/
├── app/                    # Next.js app router pages
│   ├── add-pdf/           # PDF upload page
│   ├── display/           # PDF display page with fingerprint
│   ├── library/           # Library/home page
│   └── page.tsx           # Root redirect
├── components/            # React components
│   ├── PdfViewer/         # PDF rendering components
│   ├── SpeechController/  # Text-to-speech controls
│   └── ui/                # Reusable UI components
├── lib/                   # Utility functions and hooks
├── store/                 # Zustand state management
└── styles/                # Global styles
```

## Building for Production

```bash
pnpm build
# or
npm run build
```

Start the production server:

```bash
pnpm start
# or
npm start
```

## Browser Compatibility

FlowReader uses the Web Speech API for text-to-speech, which is supported in:
- Chrome/Edge (Chromium) ✅
- Safari ✅
- Firefox ⚠️ (limited support)

For the best experience, use Edge (they have free premium voices).

## Notes

- PDFs are stored locally in your browser using IndexedDB
- Reading positions are saved in localStorage
- The application works entirely client-side - no backend required
- Text-to-speech quality depends on your system's available voices


