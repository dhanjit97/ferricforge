# Security Model

This document describes the security architecture and privacy commitments of FerrisForge Academy — Rust Playground Pro.

## Security Philosophy

The application is designed with **defense-in-depth**: no single control is relied upon for security. Multiple overlapping layers protect against common web vulnerabilities, abuse, and data leakage.

---

## Core Security Properties

### 1. No Local Code Execution

User-submitted Rust code is **never compiled or executed on the application server**. All code is forwarded to a remote compiler API (`play.rust-lang.org`) for execution. This eliminates the risk of server-side code injection, sandbox escape, or arbitrary command execution on the host.

### 2. Input Validation

All API inputs are validated against strict whitelists:

| Parameter | Allowed Values |
|-----------|----------------|
| Channel | `stable`, `beta`, `nightly` |
| Mode | `debug`, `release` |
| Edition | `2015`, `2018`, `2021`, `2024` |
| Crate type | `bin`, `lib` |
| Target | `asm`, `llvm-ir`, `hir`, `mir`, `wasm`, `expand` |

Invalid values are replaced with safe defaults rather than rejected, preventing client-side breakage while ensuring only expected values reach downstream services.

### 3. Body Size Limits

All JSON request bodies are capped at **500KB** to prevent memory exhaustion and denial-of-service attacks through oversized payloads.

### 4. Rate Limiting

Every API endpoint is rate-limited at **20 requests per minute per IP address**. This prevents:

- Abuse of AI-backed endpoints (cost burn on external AI API)
- Brute-force or flooding attacks
- Automated scraping

Rate-limited requests receive HTTP 429 with a `retryAfter` field.

### 5. Security Headers

The server sets the following headers on all responses:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; ...` | Prevents XSS and unauthorized resource loading |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking via iframes |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer information leakage |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS prefetching |
| `X-Download-Options` | `noopen` | Prevents automatic file execution in IE |
| `X-Permitted-Cross-Domain-Policies` | `none` | Restricts Adobe Flash/cross-domain policies |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), ...` | Disables sensitive browser features |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS (production only) |
| `Access-Control-Allow-Origin` | Application origin only | Restricts cross-origin requests |

### 6. CORS Restriction

Cross-Origin Resource Sharing is restricted to the application's own origin (`http://localhost:3000` in development, configured `APP_URL` in production). Preflight OPTIONS requests return 204 without executing any logic.

### 7. Error Sanitization

All server error messages are stripped of stack traces, file paths, line numbers, and internal implementation details before reaching the client. Clients receive only generic, safe messages.

### 8. No Secrets in Client

API keys (`GEMINI_API_KEY`) and credentials are read **only on the server**. They are never bundled with the client code or exposed in browser storage.

### 9. Audit Logging

All requests are logged with method, path, status code, duration, and client IP. **Request bodies (including user code) are never logged**, preventing sensitive code from appearing in server logs.

### 10. localStorage Safety

Client-side persistent state (user progress, theme, layout mode) is stored in `localStorage` using safe wrapper functions with try/catch error handling. No sensitive data (API keys, credentials) is stored in localStorage.

---

## Privacy Commitments

### Code Transmission

User-written code is transmitted to external services:

| Service | Purpose | Data Sent |
|---------|---------|-----------|
| `play.rust-lang.org` | Compilation and execution | Rust source code |
| Google Gemini AI | Error explanation, optimization, test generation (optional) | Code snippets and compiler diagnostics |

### What We Do Not Do

- We do **not** store user code on our servers.
- We do **not** log request bodies (including code).
- We do **not** sell or share user data with third parties.
- We do **not** use user code to train AI models (this is governed by the respective third-party service's terms).

### User Responsibility

**Do not paste proprietary, confidential, or secret material into the editor**, including:

- API keys, access tokens, or passwords
- Private cryptographic keys
- Proprietary algorithms or business logic
- Personally identifiable information (PII)

Code sent to external services may be logged by those services per their own privacy policies.

---

## Threat Model

| Threat | Mitigation | Residual Risk |
|--------|------------|---------------|
| XSS via user input | CSP, no `dangerouslySetInnerHTML`, React default escaping | Low — future features must maintain this discipline |
| Code injection on server | No local execution; code forwarded to external API | None — server never executes code |
| AI API cost abuse | Rate limiting (20 req/min/IP) | Medium — distributed IP abuse possible |
| Data exfiltration via XSS | Strict CSP, no inline scripts in production | Low |
| Clickjacking | `X-Frame-Options: DENY`, `frame-ancestors: 'none'` | None |
| MIME sniffing | `X-Content-Type-Options: nosniff` | None |
| Stack trace leakage | Error sanitization middleware | None |
| localStorage theft via XSS | Strict CSP limits XSS vectors | Medium — depends on CSP effectiveness |

---

## Secure Deployment Checklist

Before deploying to a public internet-facing host:

- [ ] Set `NODE_ENV=production`
- [ ] Configure `GEMINI_API_KEY` in `.env` (only if AI features are needed)
- [ ] Configure `APP_URL` to your production domain
- [ ] Place a reverse proxy (nginx, Cloudflare, etc.) in front of the server for TLS termination
- [ ] Verify the server is not binding to `0.0.0.0` (it binds to `localhost` by default)
- [ ] Review and adjust rate limits based on expected traffic
- [ ] Ensure `.env` is in `.gitignore` and never committed
- [ ] Test all API endpoints return sanitized errors (no stack traces)

---

## Security Contact

If you discover a security issue, please report it responsibly. Do not submit sensitive code or credentials when testing the application.
