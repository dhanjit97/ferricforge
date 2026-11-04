# Rust Playground Pro — Session Reference

Saved for later reference. Covers all fixes, changes, and the self-hosting setup guide discussed in this session.

---

## 1. Critical Bug Fixes

### Escaped template literal (`src/App.tsx`)
Line ~584 was printing literal `${newFiles.length}` text to users because of `\${...}`.
Fixed to `` `${newFiles.length}` ``.

### Assembly viewer wrong endpoint (`src/components/AssemblyViewer.tsx`)
Was calling `/api/optimize` (expects Rust source) to "explain assembly". Added a dedicated `/api/explain-asm` endpoint on the server and wired the viewer to it.

---

## 2. Security Hardening (`server.ts`)

- **Rate limiting**: in-memory limiter, 20 req/min per IP per endpoint. Applied to `/api/execute`, `/api/explain-error`, `/api/optimize`, `/api/generate-tests`, `/api/explain-asm`.
- **Content Security Policy**: strict header (`script-src 'self'`, `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`, `connect-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`, etc.). Dev mode allows `ws:`/`wss:` for Vite HMR.
- **Hardening headers**: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Error sanitization**: `safeError()` strips stack traces/internal paths from client responses.
- **URL workspace validation**: hash-parsed workspaces go through `sanitizeWorkspaceFiles` (path-traversal, null-byte, backslash checks, 20-file cap, 150KB/file cap).
- No `dangerouslySetInnerHTML`, `eval`, or `innerHTML=` in `src/`.

---

## 3. Logical & Correctness Fixes

- **`handleRun`**: added support for `hir` and `wasm` compile targets (were falling through silently).
- **`OutputTarget` type**: removed unsupported `check` variant.
- **`handleLoadExercise`**: now replaces the whole workspace (main.rs + Cargo.toml) so stale modules don't linger.
- **`handleVerifyExercise`**: test-pass detection uses `/test result:\s*ok/` and excludes `FAILED` (was fragile substring match).
- **Error messages**: frontend fetch errors sanitized via `safeClientError()`.

---

## 4. Type Safety

- Removed all `as any` / `: any` casts (`workspaceBundler.ts`, `diagnosticParser.ts`, two `catch` blocks in `App.tsx`).
- Added shared types: `OptimizationResult`, `OptimizationItem`, `RawWorkspaceFile`.
- `package.json`: fixed `typescript: ^7.0.2` (nonexistent) → `^5.8.0`.
- `vite.config.ts`: `__dirname` → `import.meta.dirname` (Vite `configLoader: 'native'` compatibility).
- `tsc --noEmit` passes clean.

---

## 5. UI/UX Polish

- `src/index.css`: added centralized design-token system (`--surface-*`, `--text-*`, `--accent-rust`, radii, shadows).
- Standardized inconsistent dark backgrounds across `DsaLabModal`, `CodeEditor`, `AcademyModal`.
- `ShareModal`: warns when permalink URL exceeds ~60 KB (broken links for large workspaces).
- Extracted `ModuleCreationModal` out of `CodeEditor.tsx` (~786-line god component).
- Rewrote `README.md` with features, security/privacy model, install/build docs, script table, project structure.

---

## 6. Theme & Light/Dark Mode Fixes (Only files touched: `App.tsx`, `index.css`)

### Root cause
- Root `<div>` was hardcoded `bg-neutral-900 text-neutral-100` (always dark).
- All `[data-theme="..."]` CSS rules had `!important` dark colors that applied regardless of light/dark mode.
- No `data-mode` attribute to scope dark styles.

### Changes in `src/App.tsx`
- `theme` state initialized from `localStorage` key `ferrisforge_theme` (default `'dark'`).
- Theme sync `useEffect` now also sets `data-mode="dark"` or `data-mode="light"` on `<html>`.
- Root `<div>` gets `data-mode={theme}` and conditional classes: dark → `bg-neutral-900 text-neutral-100`, light → `bg-white text-neutral-900`.
- `theme` persisted to `localStorage` on change.
- Added cross-window `storage` event listener: when another tab changes `ferrisforge_app_theme` or `ferrisforge_theme`, this tab applies it immediately (no refresh needed).

### Changes in `src/index.css`
- All 46 `[data-theme="..."]` selectors across all 7 aesthetic themes scoped to `[data-theme="..."][data-mode="dark"]`.
- Added `[data-mode="light"]` base styles: white background, dark text, light header/nav/panel colors, backdrop-filter disabled.

---

## 7. Self-Hosting Compiler Backend (Ubuntu VM + ngrok)

Instead of proxying to `play.rust-lang.org`, you can host your own compiler service and swap one line in `server.ts`:

```ts
const RUST_PLAYGROUND_BASE = 'https://your-ngrok-url.ngrok-free.app';
```

### Prerequisites (Ubuntu VM)
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git jq
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
# Install ngrok and add authtoken
ngrok config add-authtoken YOUR_NGROK_AUTHTOKEN
```

### Option A — Docker (Recommended)

**`app.js`** (Express compiler API on port 8080):
```js
const express = require('express');
const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
app.use(express.json({ limit: '500kb' }));

app.post('/execute', (req, res) => {
  const { code, edition = '2021' } = req.body;
  if (!code || typeof code !== 'string') return res.status(400).json({ error: 'code required' });
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rust-'));
  const src = path.join(workDir, 'main.rs');
  fs.writeFileSync(src, code);
  execFile('rustc', ['--edition', edition, src, '-o', path.join(workDir, 'main')],
    { cwd: workDir, timeout: 15000, maxBuffer: 1024 * 1024 },
    (err, stdout, stderr) => {
      if (err && !fs.existsSync(path.join(workDir, 'main'))) {
        return res.json({ success: false, stderr: stderr || err.message, stdout });
      }
      execFile(path.join(workDir, 'main'), [], { cwd: workDir, timeout: 15000, maxBuffer: 1024 * 1024 },
        (runErr, runOut, runErrMsg) => {
          res.json({ success: !runErr, stdout: runOut || stdout, stderr: runErrMsg || stderr });
          fs.rmSync(workDir, { recursive: true, force: true });
        });
    });
});

app.listen(8080, '127.0.0.1');
```

**`Dockerfile`**:
```dockerfile
FROM rust:1.75-slim
WORKDIR /app
COPY app.js package*.json ./
RUN npm install --omit=dev
RUN useradd -m -s /bin/bash compiler
USER compiler
EXPOSE 8080
CMD ["node", "app.js"]
```

Build & run sandboxed:
```bash
docker build -t rust-compiler .
docker run -d --name rust-compiler \
  --read-only --tmpfs /tmp:noexec,nosuid,size=50m --network none \
  --user compiler --memory=256m --cpus=1 --pids-limit=50 \
  --cap-drop=ALL --security-opt no-new-privileges \
  --restart unless-stopped rust-compiler
```

Expose:
```bash
ngrok http 8080
```

### Option B — gVisor / Firecracker (Stronger isolation)

Install gVisor:
```bash
curl -fsSL https://gvisor.dev/archive.key | sudo gpg --dearmor -o /usr/share/keyrings/gvisor-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/gvisor-archive-keyring.gpg] https://storage.googleapis.com/gvisor/releases release main" \
  | sudo tee /etc/apt/sources.list.d/gvisor.list
sudo apt update && sudo apt install -y runsc
```

Run same Docker image with `--runtime=runsc`:
```bash
docker run -d --name rust-compiler --runtime=runsc \
  --read-only --tmpfs /tmp:noexec,nosuid,size=50m --network none \
  --user compiler --memory=256m --cpus=1 --pids-limit=50 \
  --cap-drop=ALL --security-opt no-new-privileges \
  --restart unless-stopped rust-compiler
```

### Security checklist (both options)
- `--read-only` filesystem
- `--network none`
- `--user compiler` (non-root)
- `--memory=256m --cpus=1 --pids-limit=50`
- `--cap-drop=ALL --security-opt no-new-privileges`
- 15-second timeout on `rustc`
- Rate limit on `/execute`

> **Warning**: Never run unsandboxed `rustc` on a VM you care about. Build scripts/proc macros execute arbitrary code at compile time.

---

## 8. Verification

- `npx tsc --noEmit` → clean (no errors)
- `npm run dev` → server listens on `http://localhost:3000`
- App compiles and runs Rust code via the proxy (public `play.rust-lang.org` by default, or your self-hosted backend after changing `RUST_PLAYGROUND_BASE`).
