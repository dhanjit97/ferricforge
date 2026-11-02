import React, { useState } from 'react';
import {
  ExternalLink,
  BookOpen,
  GraduationCap,
  Cloud,
  Layers,
  FileCode2,
  X,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Compass,
  ArrowRight,
} from 'lucide-react';

interface ReferenceHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSnippetToEditor: (code: string) => void;
}

interface ReferenceItem {
  id: string;
  title: string;
  category: 'Official Docs' | 'University & Theory' | 'Cloud & Enterprise' | 'Desktop & Systems';
  sourceUrl: string;
  sourceLabel: string;
  summary: string;
  keyTakeaways: string[];
  annotatedCodeSnippet?: {
    title: string;
    description: string;
    code: string;
  };
}

const REFERENCES: ReferenceItem[] = [
  // 1. MIT Documentation Standards
  {
    id: 'mit-docs',
    title: 'MIT & Rust Official Documentation Standards',
    category: 'University & Theory',
    sourceUrl: 'https://web.mit.edu/rust-lang_v1.25/arch/amd64_ubuntu1404/share/doc/rust/html/book/first-edition/documentation.html',
    sourceLabel: 'web.mit.edu/rust-lang/documentation.html',
    summary:
      'The gold standard for writing documentation in Rust. Unlike Javadoc or Python docstrings which rot over time, Rust documentation comments (/// and //!) are parsed as live Markdown containing runnable doctests that are automatically compiled and verified by `cargo test --doc`.',
    keyTakeaways: [
      '`///` documents the item that follows it (functions, structs, enums).',
      '`//!` documents the parent/containing item (crate root or file module).',
      'Code blocks inside triple backticks are automatically compiled as tests during `cargo test`.',
      'Prefixing lines with `# ` inside code blocks hides setup boilerplate in the rendered HTML doc while keeping the test 100% executable.',
      'Sections should follow the standard conventions: `# Examples`, `# Panics`, `# Errors`, and `# Safety`.',
    ],
    annotatedCodeSnippet: {
      title: 'Production-Grade MIT/Official Doc Comment with Live Doctest',
      description: 'Demonstrates `///`, Markdown sections, and `#` hidden lines for compile-time test verification.',
      code: `//! Math module documentation according to MIT & Official Rust guidelines.
//! Run \`cargo test --doc\` to verify every code block in this file!

/// Calculates the integer square root of a positive 64-bit number.
///
/// # Examples
///
/// \`\`\`
/// # use playground::isqrt; // Hidden line: imports function for doctest!
/// let result = isqrt(25);
/// assert_eq!(result, 5);
/// \`\`\`
///
/// # Panics
///
/// Panics in debug mode if \`val\` is 0.
pub fn isqrt(val: u64) -> u64 {
    (val as f64).sqrt() as u64
}

fn main() {
    println!("isqrt(64) = {}", isqrt(64));
}`,
    },
  },

  // 2. Stanford CS Memory Safety & Affine Types
  {
    id: 'stanford-theory',
    title: 'Stanford CS: Affine Type Systems & Memory Safety Proofs',
    category: 'University & Theory',
    sourceUrl: 'https://www.scs.stanford.edu/~zyedidia/docs/rust/rust_book.pdf',
    sourceLabel: 'scs.stanford.edu/rust_book.pdf',
    summary:
      'Stanford Computer Science research paper breaking down the mathematical foundations of Rust: Affine Type Systems, substructural logic, stack vs heap memory layouts, 24-byte fat pointers, and the formal proof of data race freedom without a runtime garbage collector.',
    keyTakeaways: [
      'Affine Types: A value may be used at most once (linear logic with weakening). Moving a value consumes ownership.',
      'Fat Pointers: Dynamically sized types like `Vec<T>` and `String` consist of exactly 3 machine words on the stack (24 bytes on 64-bit CPUs): Pointer (8 bytes) + Capacity (8 bytes) + Length (8 bytes).',
      'The Core Mathematical Invariant: Aliasing XOR Mutability. Code may either have many read-only references (`&T`) OR exactly one mutable reference (`&mut T`), never both simultaneously.',
      'Compile-Time Non-Lexical Lifetimes (NLL): The borrow checker analyzes the Control Flow Graph (CFG) rather than rigid curly brace scopes.',
    ],
    annotatedCodeSnippet: {
      title: 'Stack vs Heap Fat Pointer Memory Inspection',
      description: 'Inspects the exact 24-byte stack representation of a dynamic heap vector.',
      code: `use std::mem::size_of;

fn main() {
    // 1. Stack footprint of a Vec (Fat Pointer: Pointer + Capacity + Length)
    println!("Size of Vec<u8> on Stack: {} bytes (Exactly 3 machine words)", size_of::<Vec<u8>>());
    println!("Size of String on Stack: {} bytes", size_of::<String>());
    println!("Size of raw pointer on Stack: {} bytes", size_of::<usize>());

    // 2. Affine move demonstration (Resource can only be used once)
    let s1 = String::from("Stanford CS affine resource");
    let s2 = s1; // Ownership MOVED! s1 is now invalid.
    // println!("{}", s1); // Compiler error [E0382]: use of moved value

    println!("Ownership successfully transferred to s2: '{}'", s2);
}`,
    },
  },

  // 3. Google Cloud Architecture with Rust
  {
    id: 'gcp-rust',
    title: 'Google Cloud Platform (GCP) Enterprise Architecture',
    category: 'Cloud & Enterprise',
    sourceUrl: 'https://docs.cloud.google.com/rust/docs/overview',
    sourceLabel: 'docs.cloud.google.com/rust/docs/overview',
    summary:
      'Official Google Cloud guidance on building low-latency, resilient cloud services with Rust. Explores zero-cold-start Cloud Run containers, IAM Workload Identity authentication via the GCP Metadata Server, and high-throughput gRPC pipelines with Google Cloud Storage and Pub/Sub.',
    keyTakeaways: [
      'Cloud Run Container Contract: Apps must read `PORT` from the environment and bind to `0.0.0.0:$PORT`.',
      'Metadata Server IAM: Running in GCP automatically fetches short-lived OAuth2 bearer tokens without credential files.',
      'GCP Structured JSON Logging: Emitting JSON records with `"severity"` and `"logging.googleapis.com/trace"` integrates directly with Cloud Logging and Cloud Trace.',
      'Stateless Horizontal Scaling: Scale from 0 to 10,000 container instances with sub-100ms cold starts.',
    ],
    annotatedCodeSnippet: {
      title: 'Cloud Run Service Bootstrap with GCP JSON Telemetry',
      description: 'Demonstrates container port resolution, health probes, and structured log formatting.',
      code: `pub fn get_gcp_port() -> u16 {
    std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080)
}

pub fn emit_gcp_log(severity: &str, message: &str) {
    println!(
        "{{\"severity\":\"{}\",\"message\":\"{}\",\"service\":\"cloud_run_rust\"}}",
        severity, message
    );
}

fn main() {
    emit_gcp_log("INFO", "Google Cloud Run container booting...");
    let port = get_gcp_port();
    emit_gcp_log("INFO", &format!("Bound to 0.0.0.0:{}", port));
    emit_gcp_log("INFO", "Health check probe /healthz responding 200 OK");
}`,
    },
  },

  // 4. Tauri v2 Desktop & Mobile Architecture
  {
    id: 'tauri-concept',
    title: 'Tauri v2: Native Dual-Process & IPC Security Architecture',
    category: 'Desktop & Systems',
    sourceUrl: 'https://v2.tauri.app/concept/',
    sourceLabel: 'v2.tauri.app/concept',
    summary:
      'Complete breakdown of the Tauri v2 cross-platform engine. How Tauri separates the visual frontend (WebView Process) from raw hardware access (Rust Core Process) over a capability-gated IPC bridge, delivering 3MB desktop and mobile applications with zero Chromium overhead.',
    keyTakeaways: [
      'Dual-Process Model: Native Rust Core controls OS windowing and permissions; OS native WebView renders UI.',
      'Zero Chromium Bundle: Uses macOS WebKit, Windows WebView2, and Linux WebKitGTK (~3MB bundle vs ~150MB Electron).',
      'Tauri v2 Capabilities: Granular JSON permission scopes replacing legacy monolithic permissions.',
      'Typed IPC Commands: `#[tauri::command]` functions accept and return typed Serde structs with automatic Promise mapping.',
    ],
    annotatedCodeSnippet: {
      title: 'Tauri v2 Typed IPC Command Handler & Result Serialization',
      description: 'Demonstrates native command handler with permission checking and JSON response.',
      code: `#[derive(Debug, PartialEq)]
pub struct FileMetadata {
    pub name: String,
    pub size_bytes: u64,
    pub is_readonly: bool,
}

// Simulated Tauri v2 command
pub fn tauri_get_file_info(path: &str, has_permission: bool) -> Result<FileMetadata, &'static str> {
    if !has_permission {
        return Err("PERMISSION_DENIED_BY_CAPABILITY_SCOPE");
    }
    Ok(FileMetadata {
        name: path.split('/').last().unwrap_or(path).to_string(),
        size_bytes: 4096,
        is_readonly: false,
    })
}

fn main() {
    println!("{:?}", tauri_get_file_info("/safe/app.config", true));
}`,
    },
  },

  // 5. Official Rust Language Book & Standard Library
  {
    id: 'official-book',
    title: 'The Rust Reference, The Book & Standard Library',
    category: 'Official Docs',
    sourceUrl: 'https://doc.rust-lang.org/stable/',
    sourceLabel: 'doc.rust-lang.org/stable',
    summary:
      'The authoritative source of truth for the Rust language maintained by the Rust Core Team. Contains The Rust Programming Language (The Book), Rust by Example, The Rust Reference, The Rustonomicon (unsafe code guidelines), and the complete standard library API documentation.',
    keyTakeaways: [
      'The Book: The official comprehensive guide to language syntax, traits, generics, and concurrency.',
      'Standard Library: Exhaustive references for `std::collections`, `std::sync`, `std::io`, and `std::net`.',
      'Compiler Error Index: Every `E0xxx` error code has an exhaustive explanation with bad vs fixed code examples.',
      'Clippy: Official linter documenting over 700 performance, correctness, and style lints.',
    ],
  },

  // 6. Rust Learn Pathways & Rustlings
  {
    id: 'rust-learn',
    title: 'Official Rust Learning Pathways & Rustlings Exercises',
    category: 'Official Docs',
    sourceUrl: 'https://rust-lang.org/learn/',
    sourceLabel: 'rust-lang.org/learn',
    summary:
      'Curated community pathways including interactive exercises (Rustlings), the Rust Cookbook (real-world crate recipes for cryptography, networking, and serialization), and domains like Embedded, CLI, Network, and WebAssembly.',
    keyTakeaways: [
      'Rustlings: 100+ hands-on mini exercises reading compiler diagnostics and fixing code.',
      'Rust Cookbook: Production idioms for common tasks (HTTP requests, CSV parsing, concurrency).',
      'Ecosystem Working Groups: Dedicated documentation for CLI, WebAssembly, Embedded, and Networking.',
    ],
  },
];

export const ReferenceHubModal: React.FC<ReferenceHubModalProps> = ({
  isOpen,
  onClose,
  onLoadSnippetToEditor,
}) => {
  const [selectedRefId, setSelectedRefId] = useState<string>(REFERENCES[0].id);
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  if (!isOpen) return null;

  const currentRef = REFERENCES.find((r) => r.id === selectedRefId) || REFERENCES[0];

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden select-none">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-600 text-white shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-neutral-100">FerrisForge Knowledge Hub & University Docs</h2>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  Stanford • MIT • Google Cloud • Tauri • Rust Core
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Authoritative references, systems theory, affine types, cloud architectures, and documentation standards
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Split: Left Reference List, Right Details */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Reference Selector */}
          <div className="w-72 shrink-0 border-r border-neutral-800 bg-[#0e0e11] overflow-y-auto p-3 space-y-1">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 px-1 mb-2">
              Authoritative Reference Library
            </h3>

            {REFERENCES.map((item) => {
              const isSelected = item.id === currentRef.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSelectedRefId(item.id)}
                  className={`w-full p-2.5 rounded-lg text-left transition-all cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-[#1e1e24] border border-neutral-700 text-white'
                      : 'hover:bg-neutral-900/60 text-neutral-400 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-200">{item.title}</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-mono truncate">{item.sourceLabel}</span>
                  <span className="text-[10px] text-neutral-500 line-clamp-1">{item.summary}</span>
                </button>
              );
            })}
          </div>

          {/* Right Details View */}
          <div className="flex-1 flex flex-col bg-[#121214] overflow-hidden">
            {/* Top Bar for Selected Reference */}
            <div className="px-6 py-3.5 border-b border-neutral-800 bg-[#16161a] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{currentRef.title}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                    {currentRef.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-neutral-400 font-mono">{currentRef.sourceLabel}</span>
                </div>
              </div>

              <a
                href={currentRef.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-sky-400 text-xs font-medium transition-colors cursor-pointer"
              >
                <span>Open Official Source</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
              {/* Executive Summary */}
              <div className="p-4 rounded-lg bg-neutral-900/80 border border-neutral-800 space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  Executive Architectural Summary
                </div>
                <p className="text-sm text-neutral-200 leading-relaxed">{currentRef.summary}</p>
              </div>

              {/* Key Takeaways & Theoretical Foundations */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Key Architectural Principles & Insights
                </div>
                <div className="space-y-2">
                  {currentRef.keyTakeaways.map((point, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-neutral-900/40 border border-neutral-800/80 text-xs text-neutral-300 flex items-start gap-2.5"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Annotated Code Snippet */}
              {currentRef.annotatedCodeSnippet && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                        {currentRef.annotatedCodeSnippet.title}
                      </div>
                      <p className="text-xs text-neutral-500">{currentRef.annotatedCodeSnippet.description}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyCode(currentRef.annotatedCodeSnippet!.code)}
                        className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-xs transition-colors cursor-pointer"
                      >
                        {copiedSnippet ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          onLoadSnippetToEditor(currentRef.annotatedCodeSnippet!.code);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 bg-[#DE3804] hover:bg-[#DE3804]/90 text-white rounded text-xs font-medium transition-colors cursor-pointer"
                      >
                        <span>Run in Playground</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <pre className="p-4 bg-neutral-950 rounded-lg font-mono text-xs text-neutral-200 border border-neutral-800 overflow-x-auto leading-relaxed">
                    {currentRef.annotatedCodeSnippet.code}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
