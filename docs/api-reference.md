# API Reference

This document describes the application's API endpoints. All routes are prefixed with `/api/`.

> **Security note:** These are internal application endpoints used by the React client. They proxy requests to external services (play.rust-lang.org and Google Gemini AI). API keys are never exposed to the client.

## Base URL

- Development: `http://localhost:3000/api`
- Production: `https://<your-app-url>/api`

---

## Endpoints

### Health Check

```http
GET /api/health
```

Returns service status. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "service": "rust-playground-pro"
}
```

---

### Execute Code

```http
POST /api/execute
```

Compiles and runs Rust code, or runs tests.

**Request body:**
```json
{
  "channel": "stable",
  "mode": "debug",
  "edition": "2021",
  "crateType": "bin",
  "tests": false,
  "code": "fn main() { println!(\"Hello\"); }",
  "backtrace": false
}
```

| Field | Type | Required | Description | Allowed values |
|-------|------|----------|-------------|----------------|
| `channel` | string | No | Rust toolchain channel | `stable`, `beta`, `nightly` |
| `mode` | string | No | Compilation mode | `debug`, `release` |
| `edition` | string | No | Rust edition | `2015`, `2018`, `2021`, `2024` |
| `crateType` | string | No | Crate type | `bin`, `lib` |
| `tests` | boolean | No | Run as tests | `true`, `false` |
| `code` | string | Yes | Rust source code | Max 250,000 characters |
| `backtrace` | boolean | No | Enable backtraces | `true`, `false` |

**Response:**
```json
{
  "success": true,
  "stdout": "Hello\n",
  "stderr": "",
  "durationMs": 1250
}
```

---

### Compile Code

```http
POST /api/compile
```

Compiles Rust code to a target representation (assembly, IR, etc.).

**Request body:**
```json
{
  "channel": "stable",
  "mode": "release",
  "edition": "2021",
  "crateType": "bin",
  "tests": false,
  "backtrace": false,
  "target": "asm",
  "code": "fn main() {}"
}
```

| Field | Type | Required | Description | Allowed values |
|-------|------|----------|-------------|----------------|
| `channel` | string | No | Rust toolchain channel | `stable`, `beta`, `nightly` |
| `mode` | string | No | Compilation mode | `debug`, `release` |
| `edition` | string | No | Rust edition | `2015`, `2018`, `2021`, `2024` |
| `crateType` | string | No | Crate type | `bin`, `lib` |
| `tests` | boolean | No | Run as tests | `true`, `false` |
| `backtrace` | boolean | No | Enable backtraces | `true`, `false` |
| `target` | string | Yes | Compilation target | `asm`, `llvm-ir`, `hir`, `mir`, `wasm`, `expand` |
| `code` | string | Yes | Rust source code | Max 250,000 characters |

**Response:**
```json
{
  "success": true,
  "code": "...assembly output...",
  "stdout": "",
  "stderr": ""
}
```

---

### Format Code

```http
POST /api/format
```

Formats Rust code using rustfmt.

**Request body:**
```json
{
  "edition": "2021",
  "code": "fn main(){println!(\"hi\");}"
}
```

**Response:**
```json
{
  "success": true,
  "code": "fn main() {\n    println!(\"hi\");\n}\n"
}
```

---

### Run Clippy

```http
POST /api/clippy
```

Runs Clippy lints on Rust code.

**Request body:**
```json
{
  "channel": "stable",
  "edition": "2021",
  "crateType": "bin",
  "code": "fn main() {}"
}
```

**Response:**
```json
{
  "success": true,
  "stdout": "...",
  "stderr": "...clippy warnings...",
  "durationMs": 800
}
```

---

### Explain Error (AI)

```http
POST /api/explain-error
```

Sends code and compiler diagnostics to an AI model for educational explanation.

**Request body:**
```json
{
  "code": "fn main() { let x = 5; let y = x; println!(\"{}\", x); }",
  "errorOutput": "error[E0382]: borrow of moved value: `x`",
  "selectedDiagnostic": "E0382"
}
```

**Response:**
```json
{
  "success": true,
  "errorCode": "E0382",
  "errorSummary": "...",
  "cause": "...",
  "borrowTimeline": [...],
  "suggestedFix": "...",
  "fixedFullCode": "...",
  "idiomaticTip": "..."
}
```

> Requires `GEMINI_API_KEY` configured on the server. Rate limited.

---

### Optimize Code (AI)

```http
POST /api/optimize
```

Sends code to an AI model for performance and idiomatic optimization suggestions.

**Request body:**
```json
{
  "code": "fn main() { let mut v = Vec::new(); v.push(1); }"
}
```

**Response:**
```json
{
  "success": true,
  "score": "B+",
  "summary": "...",
  "optimizations": [...],
  "recommendedCode": "..."
}
```

> Requires `GEMINI_API_KEY` configured on the server. Rate limited.

---

### Generate Tests (AI)

```http
POST /api/generate-tests
```

Generates a `#[cfg(test)]` module for the provided code.

**Request body:**
```json
{
  "code": "pub fn add(a: i32, b: i32) -> i32 { a + b }"
}
```

**Response:**
```json
{
  "success": true,
  "testModuleCode": "#[cfg(test)]\nmod tests { ... }",
  "description": "..."
}
```

> Requires `GEMINI_API_KEY` configured on the server. Rate limited.

---

### Explain Assembly (AI)

```http
POST /api/explain-asm
```

Sends assembly output to an AI model for explanation.

**Request body:**
```json
{
  "asm": "...assembly text..."
}
```

**Response:**
```json
{
  "success": true,
  "summary": "...",
  "keyInstructions": [...],
  "vectorizationDetected": false,
  "callingConventionNotes": "...",
  "optimizationTips": "..."
}
```

> Requires `GEMINI_API_KEY` configured on the server. Rate limited.

---

## Error Responses

All endpoints may return the following error formats:

**400 Bad Request (validation error):**
```json
{
  "success": false,
  "error": "Code is required and must not exceed 250KB"
}
```

**429 Too Many Requests (rate limit):**
```json
{
  "success": false,
  "error": "Too many requests. Please slow down and try again later.",
  "retryAfter": 45
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": "An unexpected error occurred."
}
```

> Error messages are sanitized. Stack traces and internal implementation details are never returned to the client.

---

## Rate Limits

| Endpoint Class | Limit | Window |
|----------------|-------|--------|
| All API endpoints | 20 requests | 1 minute per IP |

Rate limits are applied per IP address and per endpoint. Exceeding the limit returns HTTP 429 with a `retryAfter` field indicating seconds to wait.

---

## Input Validation Rules

- **Code length:** Maximum 250,000 characters per request.
- **Code content:** Must be a non-empty string. Null bytes are stripped.
- **Channel:** Must be one of `stable`, `beta`, `nightly`. Defaults to `stable`.
- **Mode:** Must be one of `debug`, `release`. Defaults to `debug`.
- **Edition:** Must be one of `2015`, `2018`, `2021`, `2024`. Defaults to `2021`.
- **Crate type:** Must be one of `bin`, `lib`. Defaults to `bin`.
- **Target:** Must be one of `asm`, `llvm-ir`, `hir`, `mir`, `wasm`, `expand`. Defaults to `asm`.

Invalid values are silently replaced with defaults rather than rejected, to prevent client-side breakage from unexpected inputs.
