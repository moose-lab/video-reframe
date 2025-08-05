# Video Reframe - AI-Powered Video Aspect Ratio Conversion

A modern Next.js application that uses AI to intelligently reframe videos from 512×512 pixels to different aspect ratios.

## Features

- **Smart Video Reframing**: Upload 512×512 videos and convert them to multiple aspect ratios (1:1, 3:4, 9:16, 4:3, 16:9)
- **AI-Powered Processing**: Use natural language prompts to guide the reframing process
- **Real-time Preview**: See your video in the target aspect ratio with a 1024×1024 preview
- **Modern UI**: Clean, responsive interface built with TailwindCSS
- **Type-Safe**: Full TypeScript implementation with comprehensive type definitions
- **State Management**: Zustand for efficient global state management
- **API Integration**: Ready for backend integration with React Query for async state

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS with custom components
- **State Management**: Zustand
- **API Client**: Axios with React Query
- **UI Components**: Custom components with accessibility features

## Getting Started

### Prerequisites

- Node.js 18.0.0 or higher
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-reframe
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles and Tailwind imports
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page component
├── components/
│   ├── providers/         # React Query and other providers
│   ├── ui/               # Reusable UI components
│   └── video/            # Video-specific components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and API client
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── utils/                # General utility functions
```

## Key Components

### Video Upload (`VideoUpload.tsx`)
- Drag-and-drop file upload
- File validation (format, size, dimensions)
- Support for MP4, WebM, MOV formats
- Requires exactly 512×512 pixel videos

### Prompt Input (`PromptInput.tsx`)
- Natural language input for reframing instructions
- Character count and validation
- Sample prompts for inspiration
- Real-time feedback on prompt quality

### Aspect Ratio Selector (`AspectRatioSelector.tsx`)
- Visual aspect ratio selection
- Preview of target dimensions
- Use case descriptions for each ratio

### Video Preview (`VideoPreview.tsx`)
- 1024×1024 pixel preview area
- Responsive aspect ratio containers
- Built-in video controls
- Play/pause, seek, mute functionality

### Generate Button (`GenerateButton.tsx`)
- Processing state management
- Loading indicators
- Disabled states based on input validation

## State Management

The application uses Zustand for state management with the following store structure:

```typescript
interface VideoReframeState {
  videoFile: VideoFile | null;
  prompt: string;
  aspectRatio: AspectRatio;
  isProcessing: boolean;
  processingStatus: ProcessingStatus;
  processingProgress: number;
  reframedVideoUrl: string | null;
  error: string | null;
  // ... actions
}
```

## API Integration

The app is structured to integrate with a backend API with the following endpoints:

- `POST /api/videos/process` - Upload and process video
- `GET /api/videos/status/:jobId` - Get processing status
- `GET /api/videos/download/:videoId` - Download processed video
- `DELETE /api/videos/cancel/:jobId` - Cancel processing

## Supported Video Specifications

- **Input Format**: MP4, WebM, MOV
- **Input Dimensions**: Exactly 512×512 pixels
- **Maximum File Size**: 100MB
- **Output Aspect Ratios**:
  - 1:1 (1024×1024) - Instagram posts
  - 3:4 (768×1024) - Mobile vertical
  - 9:16 (576×1024) - Stories, TikTok
  - 4:3 (1024×768) - Traditional TV
  - 16:9 (1024×576) - YouTube, widescreen

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

### Code Quality

The project includes:
- ESLint configuration for Next.js
- TypeScript strict mode
- Tailwind CSS with custom design system
- Component-based architecture
- Custom hooks for reusable logic

## Deployment

The application is ready for deployment on platforms like:
- Vercel (recommended for Next.js)
- Netlify
- Railway
- Docker containers

## License

This project is licensed under the MIT License.