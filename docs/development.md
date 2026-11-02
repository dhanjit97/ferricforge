# Development Guide

This document describes how to set up, develop, and maintain FerricForge.

---

## Prerequisites

- Node.js 18 or later
- npm, yarn, or pnpm
- A code editor with TypeScript support (VS Code recommended)

---

## Repository Setup

```bash
# Navigate to the project folder
cd rust-playground-pro

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

Edit `.env` to add your configuration (see Environment Variables below).

---

## Running the Development Server

```bash
npm run dev
```

This starts the Express server with Vite middleware on `http://localhost:3000`. The server:

- Serves the React SPA with Hot Module Replacement (HMR)
- Proxies API requests to external services
- Enables source maps for debugging

HMR can be disabled by setting `DISABLE_HMR=true` in your environment.

---

## Building for Production

```bash
npm run build
```

Outputs a production bundle to `dist/`. The bundle includes:

- Minified JavaScript and CSS
- Optimized React application
- Static assets

Serve `dist/` with any static file host or Node.js server.

---

## Type Checking

```bash
npm run lint
```

Runs `tsc --noEmit` to verify TypeScript types without emitting files. This should return zero errors before committing.

---

## Project Structure

```
src/
├── App.tsx              # Application root + state management
├── main.tsx             # React entry point
├── index.html           # HTML entry point with security meta tags
├── components/          # React components
│   ├── AcademyModal.tsx     # Guided curriculum modal
│   ├── CodeEditor.tsx       # Multi-file code editor
│   ├── TerminalOutput.tsx   # Terminal output display
│   ├── DiagnosticsPanel.tsx # Compiler diagnostics
│   ├── AssemblyViewer.tsx   # Assembly/IR viewer
│   ├── CargoManager.tsx     # Workspace and crate management
│   ├── Sidebar.tsx          # Application sidebar
│   ├── TopBar.tsx           # Top navigation bar
│   ├── ErrorBoundary.tsx    # React error boundary
│   └── ...
├── types/               # TypeScript type definitions
│   ├── curriculum.ts    # Curriculum lesson and progress types
│   ├── theme.ts         # Theme and layout types
│   ├── rust.ts          # Rust compilation types
│   └── ...
└── utils/               # Utility modules
    ├── curriculumData.ts    # Lesson data + calculateLevelFromXp
    ├── diagnosticParser.ts  # rustc diagnostic parsing
    ├── rustSnippets.ts      # Code snippets
    ├── workspaceBundler.ts  # Multi-file workspace bundling
    └── security.ts        # Client-side security utilities
server.ts                # Express API server
vite.config.ts           # Vite build configuration
tsconfig.json            # TypeScript configuration
```

---

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `GEMINI_API_KEY` | Google Gemini AI API key | (none) | Optional |
| `APP_URL` | Public application URL | `http://localhost:3000` | Optional |
| `NODE_ENV` | Environment mode | `development` | Optional |
| `DISABLE_HMR` | Disable Vite HMR | `false` | Optional |
| `VITE_BASE_PATH` | Base path for deployment | `/` | Optional |

Create a `.env` file in the project root:

```bash
GEMINI_API_KEY=your_api_key_here
APP_URL=http://localhost:3000
NODE_ENV=development
```

> **Security:** Never commit `.env` to version control. It is listed in `.gitignore`.

---

## Adding a New Lesson

Lessons are defined in `src/utils/curriculumData.ts` in the `CURRICULUM_LESSONS` array.

Each lesson requires:

```typescript
{
  id: string;                          // Unique lesson identifier
  trackId: string;                     // Stage track (e.g., 'stage-1')
  trackTitle: string;                  // Display name for track
  stage: LearningStage;                // 1 | 2 | 3 | 4 | 5
  title: string;                       // Lesson title
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Systems & Engines';
  estimatedMinutes: number;            // Estimated completion time
  xpReward: number;                    // XP awarded on completion
  overview: string;                    // Short description
  guideContent: string;                // Lesson reading material (markdown-style)
  walkthroughCode: string;             // Annotated example code
  walkthroughExplanations: Array<{ lineRange, headline, explanation }>;
  exercise: {
    id, title, description, requirements, starterCode, solutionCode, hints, verificationCriteria
  };
  knowledgeCheck?: Array<{ id, question, options, correctAnswerIndex, explanation }>;
}
```

Lessons unlock sequentially — a lesson is only available after the previous lesson is marked complete.

---

## Adding a New API Endpoint

Endpoints are defined in `server.ts`. Follow these guidelines:

1. **Validate all inputs** against whitelisted values.
2. **Apply rate limiting** using the `rateLimiter(endpoint)` middleware.
3. **Cap request body size** (already handled globally at 500KB).
4. **Sanitize error messages** using `safeError()` before sending to client.
5. **Never log request bodies** (audit logging excludes bodies).

Example:
```typescript
app.post('/api/new-endpoint', rateLimiter('/api/new-endpoint'), async (req, res) => {
  const { param } = req.body;
  // Validate param...
  // Process...
  // Return sanitized response...
});
```

---

## Adding a New Component

1. Create the component in `src/components/`.
2. Export it as a named export or default export.
3. Import and use it in `App.tsx` or another parent component.
4. Follow the existing styling conventions (Tailwind CSS classes).
5. Wrap user-facing content in `ErrorBoundary` where appropriate.

---

## Security Checklist for Contributors

- [ ] No `dangerouslySetInnerHTML` usage
- [ ] All user input validated before processing
- [ ] No API keys or secrets in client-side code
- [ ] Error messages sanitized (no stack traces)
- [ ] localStorage access wrapped in safe utilities
- [ ] New API endpoints include rate limiting
- [ ] CSP headers not weakened without security review

---

## Testing

There is no dedicated test suite at this time. Manual testing should cover:

- Code execution with valid and invalid Rust
- Knowledge check submission and scoring
- Lesson gating (locked/unlocked states)
- localStorage persistence (refresh and return)
- Error boundary behavior (trigger a runtime error)

---

## Deployment

1. Build the project: `npm run build`
2. Set environment variables on the deployment host
3. Serve `dist/` with a static file server or Node.js
4. Place a reverse proxy (nginx, Cloudflare) in front for TLS termination
5. Verify all security headers are present in production responses

---

## License

MIT License.
