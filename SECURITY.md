# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

Please disclose security vulnerabilities responsibly. Do not file public issues
for security concerns.

Email: security@ferricforge.example

Include:
- A clear description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide an initial assessment
within 5 business days.

## Scope

In scope:
- `src/` — frontend React application
- `server.ts` — Express backend API
- `src/utils/security.ts` — client security utilities

Out of scope:
- Third-party services (Rust Playground API, Gemini AI API)
- Issues requiring physical access or social engineering

## Safe Coding Practices in This Project

- User code is never executed locally; it is proxied to play.rust-lang.org
- AI explanations send code snippets to Google Gemini (server-side only)
- All API endpoints are rate-limited per IP per endpoint
- CSP headers prevent inline script execution in production
- No cookies or session-based authentication is used
- localStorage stores only non-sensitive curriculum progress
