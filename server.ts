import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

dotenv.config();

const app = express();
// Trust proxy is disabled — this server only ever binds to localhost.
app.set('trust proxy', false);

// Enforce strict 500KB body limit to prevent memory exhaustion and DoS
app.use(express.json({ limit: '500kb' }));

// Request duration + audit logging middleware (never logs request bodies or code)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `[audit] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms ip=${req.ip}`
    );
  });
  next();
});

// ---------------------------------------------------------------------------
// Security hardening
// ---------------------------------------------------------------------------

// In-memory rate limiter: { `${ip}:${endpoint}`: [timestamps] }
// Prevents API-key abuse and cost burn on AI-backed endpoints.
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 20;     // per minute per endpoint
const rateStore = new Map<string, number[]>();

function rateLimiter(endpoint: string) {
  return (_req: express.Request, _res: express.Response, next: express.NextFunction) => {
    const ip = (_req.ip || _req.socket.remoteAddress || 'unknown').toString();
    const key = `${ip}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    const hits = (rateStore.get(key) || []).filter((t) => t > windowStart);
    if (hits.length >= RATE_LIMIT_MAX_REQUESTS) {
      return _res.status(429).json({
        success: false,
        error: 'Too many requests. Please slow down and try again later.',
        retryAfter: Math.ceil((RATE_LIMIT_WINDOW_MS - (now - windowStart)) / 1000) || 1,
      });
    }
    hits.push(now);
    rateStore.set(key, hits);
    next();
  };
}

// Strict Content Security Policy.
// In dev we must allow inline scripts (Vite HMR / React Fast Refresh injects
// them) and the Vite websocket (connect-src ws:). In production these can be
// tightened further. Fonts are served from Google Fonts.
app.use((_req, res, next) => {
  const isDev = process.env.NODE_ENV !== 'production';
  const scriptSrc = isDev ? "'self' 'unsafe-inline'" : "'self'";
  const connectSrc = isDev ? "'self' ws: wss:" : "'self'";

  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      `script-src ${scriptSrc}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https:",
      "font-src 'self' https://fonts.gstatic.com",
      `connect-src ${connectSrc}`,
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'none'",
      "frame-ancestors 'none'",
      "worker-src 'none'",
      "manifest-src 'self'",
    ].join('; ')
  );
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), ambient-light-sensor=(), bluetooth=()'
  );
  if (!isDev) {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  next();
});

// CORS — restrict to the app's own origin only. The server binds to localhost
// so cross-origin requests are not expected, but this defense-in-depth block
// prevents any unexpected cross-origin access.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigin = 'http://localhost:3000';
  if (origin === allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Health endpoint — no authentication, no code execution, safe to poll.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'rust-playground-pro' });
});

// Return generic, safe error messages to clients — never leak stack traces or internals.
function safeError(message: string): string {
  return message
    .replace(/at [^\n]*/g, '')
    .replace(/Error: /g, '')
    .trim() || 'An unexpected error occurred.';
}

const RUST_PLAYGROUND_BASE = 'https://play.rust-lang.org';

// Validation sets for security whitelisting
const ALLOWED_CHANNELS = new Set(['stable', 'beta', 'nightly']);
const ALLOWED_MODES = new Set(['debug', 'release']);
const ALLOWED_EDITIONS = new Set(['2015', '2018', '2021', '2024']);
const ALLOWED_CRATE_TYPES = new Set(['bin', 'lib']);
const ALLOWED_TARGETS = new Set(['asm', 'llvm-ir', 'hir', 'mir', 'wasm', 'expand']);

function isValidCode(code: unknown): code is string {
  return typeof code === 'string' && code.length > 0 && code.length <= 250000;
}

function cleanMarkdownJson(text: string): string {
  if (!text) return '{}';
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

// Helper to safely fetch from play.rust-lang.org with timeout & size defense
async function proxyRustPlayground(endpoint: string, body: Record<string, unknown>) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);

  try {
    const response = await fetch(`${RUST_PLAYGROUND_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'RustPlaygroundPro/1.0',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      // Truncate long error bodies to prevent client-side lockup
      const safeError = errorText.length > 500 ? errorText.slice(0, 500) + '... (truncated)' : errorText;
      return {
        success: false,
        error: `Rust Playground API returned HTTP ${response.status}: ${safeError}`,
      };
    }

    const data = await response.json();
    return data;
  } catch (err: unknown) {
    clearTimeout(timeout);
    const errorMsg = err instanceof Error ? err.message : String(err);
    const isAbort = (err as { name?: string })?.name === 'AbortError';
    return {
      success: false,
      error: isAbort
        ? 'Request timed out after 18 seconds. Please check compiler settings or infinite loops.'
        : `Network error connecting to compiler: ${errorMsg}`,
    };
  }
}

// 1. Execute (cargo run or cargo test)
app.post('/api/execute', rateLimiter('/api/execute'), async (req, res) => {
  const { channel = 'stable', mode = 'debug', edition = '2021', crateType = 'bin', tests = false, code, backtrace = false } = req.body;

  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Code is required and must not exceed 250KB' });
  }

  const safeChannel = ALLOWED_CHANNELS.has(channel) ? channel : 'stable';
  const safeMode = ALLOWED_MODES.has(mode) ? mode : 'debug';
  const safeEdition = ALLOWED_EDITIONS.has(edition) ? edition : '2021';
  const safeCrateType = ALLOWED_CRATE_TYPES.has(crateType) ? crateType : 'bin';

  const result = await proxyRustPlayground('/execute', {
    channel: safeChannel,
    mode: safeMode,
    edition: safeEdition,
    crateType: safeCrateType,
    tests: Boolean(tests),
    code,
    backtrace: Boolean(backtrace),
  });

  res.json(result);
});

// 2. Compile targets (asm, llvm-ir, hir, mir, wasm, expand)
app.post('/api/compile', rateLimiter('/api/compile'), async (req, res) => {
  const { channel = 'stable', mode = 'release', edition = '2021', crateType = 'bin', tests = false, backtrace = false, target = 'asm', code } = req.body;

  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Code is required and must not exceed 250KB' });
  }

  const safeChannel = ALLOWED_CHANNELS.has(channel) ? channel : 'stable';
  const safeMode = ALLOWED_MODES.has(mode) ? mode : 'release';
  const safeEdition = ALLOWED_EDITIONS.has(edition) ? edition : '2021';
  const safeCrateType = ALLOWED_CRATE_TYPES.has(crateType) ? crateType : 'bin';
  const safeTarget = ALLOWED_TARGETS.has(target) ? target : 'asm';

  const result = await proxyRustPlayground('/compile', {
    channel: safeChannel,
    mode: safeMode,
    edition: safeEdition,
    crateType: safeCrateType,
    tests: Boolean(tests),
    backtrace: Boolean(backtrace),
    target: safeTarget,
    code,
  });

  res.json(result);
});

// 3. Format (rustfmt)
app.post('/api/format', rateLimiter('/api/format'), async (req, res) => {
  const { edition = '2021', code } = req.body;

  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Code is required and must not exceed 250KB' });
  }

  const safeEdition = ALLOWED_EDITIONS.has(edition) ? edition : '2021';

  const result = await proxyRustPlayground('/format', {
    edition: safeEdition,
    code,
  });

  res.json(result);
});

// 4. Clippy
app.post('/api/clippy', rateLimiter('/api/clippy'), async (req, res) => {
  const { channel = 'stable', edition = '2021', crateType = 'bin', code } = req.body;

  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Code is required and must not exceed 250KB' });
  }

  const safeChannel = ALLOWED_CHANNELS.has(channel) ? channel : 'stable';
  const safeEdition = ALLOWED_EDITIONS.has(edition) ? edition : '2021';
  const safeCrateType = ALLOWED_CRATE_TYPES.has(crateType) ? crateType : 'bin';

  const result = await proxyRustPlayground('/clippy', {
    channel: safeChannel,
    edition: safeEdition,
    crateType: safeCrateType,
    code,
  });

  res.json(result);
});

// 5. Intelligent Rust Error & Borrow Checker Explainer (rate limited)
app.post('/api/explain-error', rateLimiter('/api/explain-error'), async (req, res) => {
  const { code, errorOutput, selectedDiagnostic } = req.body;

  if (!isValidCode(code) || typeof errorOutput !== 'string') {
    return res.status(400).json({ success: false, error: 'Valid code and error output are required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      success: false,
      explanation: 'AI Error Explainer requires GEMINI_API_KEY. You can review the rustc output diagnostics directly.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a Rust language compiler and borrow-checker expert.
Analyze this Rust code and compiler error diagnostics carefully.
Be educational, precise, and practical.

Rust Code:
\`\`\`rust
${code.slice(0, 10000)}
\`\`\`

Compiler Diagnostics:
\`\`\`
${errorOutput.slice(0, 5000)}
\`\`\`
${selectedDiagnostic && typeof selectedDiagnostic === 'string' ? `Focus specifically on: ${selectedDiagnostic.slice(0, 500)}` : ''}

Provide your response in JSON format with exactly the following schema:
{
  "errorCode": "e.g. E0382 or null",
  "errorSummary": "1-2 sentence plain-English summary of what rustc is rejecting",
  "cause": "Detailed explanation of why Rust's ownership, borrowing, or type rules prevent this",
  "borrowTimeline": [
    { "step": 1, "description": "e.g. String allocated on heap and assigned to variable 's' (line 2)" },
    { "step": 2, "description": "e.g. Ownership of 's' moved into function 'take_ownership' (line 4)" },
    { "step": 3, "description": "e.g. Attempted borrow/read of 's' after move (line 5)" }
  ],
  "suggestedFix": "Code snippet showing the recommended fix",
  "fixedFullCode": "The complete revised working Rust code",
  "idiomaticTip": "A key Rust idiom or mental model takeaway"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleaned = cleanMarkdownJson(response.text || '{}');
    const parsed = JSON.parse(cleaned);
    return res.json({ success: true, ...parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: safeError(message) });
  }
});

// 6. Rust Code Optimizer & Idiomatic Refactorer (rate limited)
app.post('/api/optimize', rateLimiter('/api/optimize'), async (req, res) => {
  const { code } = req.body;
  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Valid code is required (max 250KB)' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      success: false,
      explanation: 'Gemini API key is not configured.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are a principal Rust engineer.
Review this Rust code for:
1. Performance (reducing unnecessary heap allocations, unnecessary .clone(), using iterators / slices)
2. Safety & Idiomatic patterns (proper Result/Option handling, custom Error types, pattern matching)
3. Zero-cost abstractions

Code:
\`\`\`rust
${code.slice(0, 10000)}
\`\`\`

Return a JSON object with:
{
  "score": "A letter grade or rating, e.g. 'A-', 'B+'",
  "summary": "High level assessment",
  "optimizations": [
    { "title": "...", "explanation": "...", "diffSnippet": "..." }
  ],
  "recommendedCode": "Complete refactored Rust code"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleaned = cleanMarkdownJson(response.text || '{}');
    const parsed = JSON.parse(cleaned);
    return res.json({ success: true, ...parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: safeError(message) });
  }
});

// 7. Unit Test Generator (rate limited)
app.post('/api/generate-tests', rateLimiter('/api/generate-tests'), async (req, res) => {
  const { code } = req.body;
  if (!isValidCode(code)) {
    return res.status(400).json({ success: false, error: 'Valid code is required (max 250KB)' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      success: false,
      explanation: 'Gemini API key is not configured.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Write a comprehensive, idiomatic \`#[cfg(test)] mod tests { ... }\` module for the following Rust code.
Include standard test cases, edge cases (empty inputs, bounds, negative numbers if applicable), and test assertions using assert_eq!, assert!, etc.

Rust Code:
\`\`\`rust
${code.slice(0, 10000)}
\`\`\`

Return JSON:
{
  "testModuleCode": "The full #[cfg(test)] mod tests { ... } code snippet",
  "description": "Short explanation of the tests created"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleaned = cleanMarkdownJson(response.text || '{}');
    const parsed = JSON.parse(cleaned);
    return res.json({ success: true, ...parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: safeError(message) });
  }
});

// 8. Assembly Explainer — dedicated endpoint so ASM is never sent to the Rust
// code optimizer (which expects Rust source and would return irrelevant advice).
app.post('/api/explain-asm', rateLimiter('/api/explain-asm'), async (req, res) => {
  const { asm } = req.body;
  if (typeof asm !== 'string' || asm.length === 0 || asm.length > 50000) {
    return res.status(400).json({ success: false, error: 'Valid assembly snippet is required (max 50KB)' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.json({
      success: false,
      explanation: 'Gemini API key is not configured.',
    });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `You are an expert in x86_64 assembly and compiler internals.
Explain the following compiler-generated assembly in plain, educational terms.

Focus on:
- What the function prologue/epilogue is doing (stack frame, callee-saved registers)
- Which instructions implement the core logic (arithmetic, loops, calls, branches)
- Whether the compiler auto-vectorized (look for xmm/ymm registers, SIMD instructions)
- Calling convention details (argument passing in registers)
- Any obvious optimization opportunities

Assembly snippet:
\`\`\`asm
${asm.slice(0, 10000)}
\`\`\`

Return JSON with exactly this schema:
{
  "summary": "2-3 sentence plain-English summary of what this assembly does",
  "keyInstructions": [{ "instruction": "...", "purpose": "..." }],
  "vectorizationDetected": true|false,
  "callingConventionNotes": "notes on register usage and stack frame",
  "optimizationTips": "actionable tips to improve the generated code"
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const cleaned = cleanMarkdownJson(response.text || '{}');
    const parsed = JSON.parse(cleaned);
    return res.json({ success: true, ...parsed });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ success: false, error: safeError(message) });
  }
});

// Vite Middleware mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  const PORT = 3000;
  app.listen(PORT, 'localhost', () => {
    console.log(`FerricForge server listening on http://localhost:${PORT}`);
  });
}

startServer();
