# User Guide

This guide walks you through using FerrisForge Academy — Rust Playground Pro, from writing your first program to completing the guided curriculum.

---

## 1. Writing and Running Code

### The Editor

The main workspace contains a multi-file Rust editor. By default it includes:

- `src/main.rs` — Your entry point
- `src/math.rs` — An example module
- `Cargo.toml` — Package manifest

### Running Code

1. Write Rust code in the editor.
2. Click the **Run** button (or press `Ctrl+Enter` / `Cmd+Enter`).
3. View output in the **Terminal** tab on the right inspector pane.

### Switching Files

Click a file tab in the editor sidebar, or use the Cargo Manager to create new modules.

---

## 2. Compiler Diagnostics

When your code has errors:

1. Run the code.
2. Click the **Diagnostics** tab in the inspector.
3. Errors and warnings are listed with mapped line numbers.
4. Click a diagnostic to jump to the error location in the editor.

---

## 3. Assembly and IR Viewer

To inspect compiled output:

1. Select a target from the Cargo Manager or sidebar (ASM, LLVM-IR, HIR, MIR, WASM, Expand).
2. Click **Run** or **Compile**.
3. View the generated output in the **Assembly** tab.

---

## 4. Clippy Lints

To check your code for idiomatic Rust issues:

1. Select **Clippy** as the compile target.
2. Click **Run**.
3. Review lint suggestions in the diagnostics panel.

---

## 5. Academy — Guided Curriculum

The Academy modal provides a structured learning path.

### Opening the Academy

Click the **Academy** button in the sidebar or top bar.

### Navigating Lessons

1. Select a lesson from the left sidebar (lessons unlock sequentially).
2. Choose a tab:
   - **Concepts From Scratch** — Lesson overview and reading material
   - **Annotated Code Walkthrough** — Line-by-line code explanation
   - **Practice Challenge** — Hands-on exercise with starter code
   - **Knowledge Check** — Quiz to test understanding (appears when available)

### Completing Exercises

1. Click **Load Exercise into Playground** to populate the editor with starter code.
2. Write your solution.
3. Click **Verify Solution & Claim XP**.
4. If tests pass, you earn XP and the lesson is marked complete. The next lesson unlocks automatically.

### Knowledge Checks

Some lessons include a Knowledge Check tab:

1. Answer all multiple-choice questions.
2. Click **Submit Knowledge Check**.
3. Review your score and per-question explanations.
4. A perfect score unlocks the **Go to Practice Challenge** button.

### Progress Tracking

- Your level, title, and XP are shown in the Academy header.
- Completed lessons are marked with a checkmark in the lesson list.
- Progress is saved automatically to your browser's local storage.

---

## 6. Frameworks Section

Explore how popular Rust frameworks work under the hood:

- **Architecture** — Mental model and data flow diagrams
- **Design Guide** — Recommended project layout and patterns
- **Production Snippets** — Ready-to-copy code examples
- **Challenge** — Hands-on framework implementation exercise

---

## 7. Capstones

One-click multi-file project workspaces:

1. Browse available capstone projects in the Academy.
2. Select a project to view its description and difficulty.
3. Click **Load into Workspace** to import all project files into your editor.
4. Build, modify, and run the project locally.

---

## 8. DSA Lab

Visualize data structures and algorithms with memory-model diagrams:

1. Select a DSA topic from the Academy sidebar.
2. Explore interactive diagrams showing memory layout, pointers, and operations.
3. Load example code into the editor to experiment.

---

## 9. Settings

Accessible from the sidebar:

- **Theme** — Change visual appearance (Glassmorphism, Neumorphism, Minimalism, etc.)
- **Dark/Light Mode** — Toggle color scheme
- **Layout Mode** — Split, Zen, or Analysis view
- **Split Percentage** — Adjust editor vs. inspector width

---

## 10. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Enter` / `Cmd+Enter` | Run code |
| `Ctrl+S` / `Cmd+S` | Format code |

---

## 11. Privacy and Safety

> **Important:** Code written in this editor is sent to external compilation and AI services for processing. Do not enter:
> - API keys, passwords, or access tokens
> - Private cryptographic keys
> - Proprietary or confidential code
> - Personally identifiable information

Progress data (lessons completed, XP, hints unlocked) is stored locally in your browser. Clearing your browser data will reset your progress.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Code won't run | Check the Diagnostics tab for compiler errors |
| AI features not working | Ensure `GEMINI_API_KEY` is configured on the server |
| Progress not saving | Check browser localStorage settings and permissions |
| Layout broken | Reset layout mode from Settings |
| ErrorBoundary appeared | Click "Reset to Clean Workspace" to clear corrupted state |
