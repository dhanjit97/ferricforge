# Contributing to FerricForge

Thank you for considering a contribution! This project is a Rust learning
platform with a terminal-grade IDE, interactive academy, and memory inspector.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Install dependencies: `npm install`
4. Copy `.env.example` to `.env.local` and add your `GEMINI_API_KEY`
5. Run the dev server: `npm run dev`
6. Open `http://localhost:3000`

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build via Vite |
| `npm run preview` | Preview production build locally |
| `npm run lint` | TypeScript type check (`tsc --noEmit`) |
| `npm run clean` | Remove `dist/` and `server.js` |

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run lint` to verify TypeScript compiles
4. Run `npm run build` to verify production build
5. Commit with a descriptive message
6. Open a pull request against `main`

## Security

If you find a security vulnerability, please see [SECURITY.md](SECURITY.md)
before opening a public issue.

## Code Style

- Follow the existing Tailwind + React patterns
- Use TypeScript strict types; avoid `any`
- Keep components small and focused
- Add comments for non-obvious logic
