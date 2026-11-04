import React, { useState, useEffect } from 'react';
import { POPULAR_CRATES } from '../utils/crateRegistry';
import { CrateItem, WorkspaceFile } from '../types/rust';
import {
  getModuleNameFromPath,
  hasModDeclaration,
  getModDeclarations,
} from '../utils/workspaceBundler';
import {
  Package,
  Plus,
  Check,
  Search,
  ExternalLink,
  Code,
  FileCode,
  Folder,
  Trash2,
  FilePlus2,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface CargoManagerProps {
  files: WorkspaceFile[];
  cargoToml: string;
  onChangeCargoToml: (val: string) => void;
  onSelectFile: (path: string) => void;
  onCreateModule: (modName: string, declareInMain: boolean, initialContent?: string) => void;
  onDeleteModule: (path: string) => void;
  onToggleModDeclaration: (modName: string) => void;
  onInsertImport: (importStmt: string) => void;
}

export const CargoManager: React.FC<CargoManagerProps> = ({
  files,
  cargoToml,
  onChangeCargoToml,
  onSelectFile,
  onCreateModule,
  onDeleteModule,
  onToggleModDeclaration,
  onInsertImport,
}) => {
  const [activeSection, setActiveSection] = useState<'modules' | 'crates'>('modules');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [newModName, setNewModName] = useState('');
  const [autoDeclare, setAutoDeclare] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('math');

  const mainFile = files.find((f) => f.path === 'src/main.rs');
  const mainContent = mainFile?.content || '';
  const declaredMods = getModDeclarations(mainContent);

  const moduleFiles = files.filter(
    (f) => f.path.startsWith('src/') && f.path !== 'src/main.rs'
  );

  const isCrateInToml = (toml: string, crateName: string): boolean => {
    const escaped = crateName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^[ \\t]*${escaped}\\s*=`, 'm');
    return regex.test(toml);
  };

  const [addedCrateNames, setAddedCrateNames] = useState<Set<string>>(() => {
    const set = new Set<string>();
    POPULAR_CRATES.forEach((c) => {
      const escaped = c.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (new RegExp(`^[ \\t]*${escaped}\\s*=`, 'm').test(cargoToml)) {
        set.add(c.name);
      }
    });
    return set;
  });

  useEffect(() => {
    const set = new Set<string>();
    POPULAR_CRATES.forEach((c) => {
      if (isCrateInToml(cargoToml, c.name)) {
        set.add(c.name);
      }
    });
    setAddedCrateNames(set);
  }, [cargoToml]);

  const categories = [
    'all',
    'Serialization',
    'Async & Concurrency',
    'Error Handling',
    'Utilities',
    'Data Structures',
  ];

  const filteredCrates = POPULAR_CRATES.filter((crate) => {
    const matchesSearch =
      crate.name.toLowerCase().includes(search.toLowerCase()) ||
      crate.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || crate.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleToggleCrate = (crate: CrateItem) => {
    let newToml = cargoToml;
    const isPresent = isCrateInToml(cargoToml, crate.name);

    if (isPresent) {
      const escaped = crate.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`^[ \\t]*${escaped}\\s*=.*$\\n?`, 'm');
      newToml = newToml.replace(regex, '');
    } else {
      if (!newToml.includes('[dependencies]')) {
        newToml += '\n[dependencies]\n';
      }
      const depLine =
        crate.features && crate.features.length > 0
          ? `${crate.name} = { version = "${crate.version}", features = [${crate.features
              .map((f) => `"${f}"`)
              .join(', ')}] }\n`
          : `${crate.name} = "${crate.version}"\n`;

      newToml += depLine;
    }

    onChangeCargoToml(newToml);
  };

  const moduleTemplates: Record<
    string,
    { label: string; name: string; description: string; code: string }
  > = {
    math: {
      label: 'Math / Computations',
      name: 'math',
      description: 'Functions for mathematical operations and algorithms',
      code: `//! Math and computational utilities module

pub fn add(a: i32, b: i32) -> i32 {
    a + b
}

pub fn multiply(a: i32, b: i32) -> i32 {
    a * b
}

pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0;
            let mut b = 1;
            for _ in 2..=n {
                let temp = a + b;
                a = b;
                b = temp;
            }
            b
        }
    }
}
`,
    },
    models: {
      label: 'Data Models & Structs',
      name: 'models',
      description: 'Strongly typed domain entities and data structures',
      code: `//! Domain models and data structures

#[derive(Debug, Clone, PartialEq)]
pub struct User {
    pub id: u64,
    pub username: String,
    pub active: bool,
}

impl User {
    pub fn new(id: u64, username: impl Into<String>) -> Self {
        Self {
            id,
            username: username.into(),
            active: true,
        }
    }

    pub fn display_badge(&self) -> String {
        format!("[User #{}] {} ({})", self.id, self.username, if self.active { "Active" } else { "Offline" })
    }
}
`,
    },
    errors: {
      label: 'Custom Error Types',
      name: 'errors',
      description: 'Enum errors implementing Display and Error traits',
      code: `//! Application error handling module

use std::fmt;

#[derive(Debug)]
pub enum AppError {
    NotFound(String),
    InvalidInput(String),
    Internal(String),
}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::NotFound(msg) => write!(f, "Entity not found: {}", msg),
            AppError::InvalidInput(msg) => write!(f, "Validation failure: {}", msg),
            AppError::Internal(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}
`,
    },
    utils: {
      label: 'Helpers & Utilities',
      name: 'utils',
      description: 'String manipulation, timing, and formatting helpers',
      code: `//! General helper functions

pub fn format_header(title: &str) -> String {
    format!("=== {} ===", title.to_uppercase())
}

pub fn truncate_ellipsis(text: &str, max_len: usize) -> String {
    if text.len() <= max_len {
        text.to_string()
    } else {
        format!("{}...", &text[..max_len])
    }
}
`,
    },
  };

  const handleCreateModuleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = (newModName || moduleTemplates[selectedTemplate]?.name || '').trim();
    if (!cleanName) return;

    const content = moduleTemplates[selectedTemplate]?.code || '// New Rust module\n';
    onCreateModule(cleanName, autoDeclare, content);
    setNewModName('');
  };

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-neutral-200 text-xs overflow-hidden select-none theme-panel">
      {/* Top Header & Sub-navigation */}
      <div className="p-3 border-b border-neutral-800 bg-[#161b22] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-neutral-200">
              Workspace & Dependencies Manager
            </span>
          </div>

          <div className="flex items-center gap-1 p-0.5 bg-neutral-800 rounded-md">
            <button
              onClick={() => setActiveSection('modules')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'modules'
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-[#DE3804]" />
              <span>Workspace Modules ({moduleFiles.length})</span>
            </button>

            <button
              onClick={() => setActiveSection('crates')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                activeSection === 'crates'
                  ? 'bg-neutral-700 text-white shadow-xs'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5 text-amber-500" />
              <span>Crate Dependencies ({addedCrateNames.size})</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: WORKSPACE MODULES & MOD DECLARATIONS */}
      {activeSection === 'modules' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Main.rs Mod Declarations Banner */}
          <div className="p-3.5 rounded-lg bg-neutral-900 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-[#DE3804]" />
                <span className="font-semibold text-neutral-200">
                  Module Declarations in <code className="font-mono text-xs">src/main.rs</code>
                </span>
              </div>
              <span className="text-[11px] text-neutral-400">
                {declaredMods.length} {declaredMods.length === 1 ? 'module' : 'modules'} declared
              </span>
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed">
              In Rust, files in <code className="font-mono text-neutral-300">src/</code> must be declared in <code className="font-mono text-neutral-300">src/main.rs</code> using <code className="font-mono text-[#DE3804]">mod &lt;name&gt;;</code> before their functions and types can be used.
            </p>

            {declaredMods.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {declaredMods.map((modName) => (
                  <div
                    key={modName}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-800 border border-neutral-700 font-mono text-xs text-emerald-300"
                  >
                    <Check className="w-3 h-3 text-emerald-400" />
                    <span>mod {modName};</span>
                    <button
                      onClick={() => onToggleModDeclaration(modName)}
                      title={`Remove mod ${modName}; from main.rs`}
                      className="ml-1 text-neutral-400 hover:text-red-400 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] text-amber-400/90 italic pt-1">
                No custom `mod` declarations in main.rs yet. Create a module below to link it!
              </div>
            )}
          </div>

          {/* List of Modules in src/ */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Folder className="w-3.5 h-3.5 text-neutral-400" />
                <span>Files in src/ ({files.filter((f) => f.path.startsWith('src/')).length})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* main.rs card (Protected) */}
              <div className="p-3 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-[#DE3804]" />
                  <div>
                    <div className="font-mono font-semibold text-neutral-200">src/main.rs</div>
                    <div className="text-[11px] text-neutral-500">Root binary entry point</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-semibold text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                    Main Entry
                  </span>
                  <button
                    onClick={() => onSelectFile('src/main.rs')}
                    className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-neutral-200 text-xs font-medium transition-colors cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              </div>

              {/* Custom Modules in src/*.rs */}
              {moduleFiles.map((file) => {
                const modName = getModuleNameFromPath(file.path);
                const isDeclared = hasModDeclaration(mainContent, modName);

                return (
                  <div
                    key={file.path}
                    className={`p-3 rounded-lg border transition-all theme-card ${
                      isDeclared
                        ? 'bg-neutral-900/90 border-neutral-800'
                        : 'bg-neutral-900/60 border-amber-500/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <FileCode className="w-4 h-4 text-sky-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-neutral-200">
                              {file.path}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded flex items-center gap-1 ${
                                isDeclared
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {isDeclared ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              <span>{isDeclared ? `mod ${modName}; declared` : 'undeclared'}</span>
                            </span>
                          </div>
                          <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            {file.content.split('\n').length} lines · {file.content.length} chars
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Toggle mod declaration */}
                        <button
                          onClick={() => onToggleModDeclaration(modName)}
                          className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                            isDeclared
                              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                              : 'bg-amber-500 hover:bg-amber-600 text-black font-semibold'
                          }`}
                        >
                          {isDeclared ? 'Remove from main.rs' : 'Declare in main.rs'}
                        </button>

                        {/* Open in Editor */}
                        <button
                          onClick={() => onSelectFile(file.path)}
                          className="px-2.5 py-1 bg-[#DE3804] hover:bg-[#C23103] text-white rounded text-xs font-medium transition-colors cursor-pointer"
                        >
                          Open
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${file.name}?`)) {
                              onDeleteModule(file.path);
                            }
                          }}
                          title="Delete module"
                          className="p-1 text-neutral-500 hover:text-red-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create New Module Form & Presets */}
          <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center gap-2">
              <FilePlus2 className="w-4 h-4 text-[#DE3804]" />
              <h3 className="text-xs font-bold text-neutral-200">Create New Module</h3>
            </div>

            <form onSubmit={handleCreateModuleSubmit} className="space-y-3">
              {/* Presets Selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-neutral-400">Choose Module Template:</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries(moduleTemplates).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        setSelectedTemplate(key);
                        setNewModName(t.name);
                      }}
                      className={`p-2 rounded text-left border transition-all cursor-pointer ${
                        selectedTemplate === key
                          ? 'bg-neutral-800 border-[#DE3804] text-white'
                          : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      <div className="font-semibold text-xs">{t.label}</div>
                      <div className="font-mono text-[10px] text-neutral-500">{t.name}.rs</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Module Name Input */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center gap-1 flex-1">
                  <span className="text-neutral-500 font-mono text-xs">src/</span>
                  <input
                    type="text"
                    placeholder="e.g. math, models, utils"
                    value={newModName || moduleTemplates[selectedTemplate]?.name}
                    onChange={(e) =>
                      setNewModName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))
                    }
                    className="flex-1 px-3 py-1.5 bg-neutral-950 border border-neutral-700 rounded text-xs text-neutral-100 font-mono focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
                  />
                  <span className="text-neutral-500 font-mono text-xs">.rs</span>
                </div>

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white rounded font-medium text-xs transition-colors cursor-pointer shrink-0"
                >
                  Create Module
                </button>
              </div>

              {/* Auto declare checkbox */}
              <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 text-xs">
                <input
                  type="checkbox"
                  checked={autoDeclare}
                  onChange={(e) => setAutoDeclare(e.target.checked)}
                  className="rounded border-neutral-700 text-[#DE3804] focus:ring-[#DE3804]"
                />
                <span>
                  Automatically declare in <code className="font-mono text-neutral-200">src/main.rs</code> (add <code className="font-mono text-amber-400">mod {newModName || moduleTemplates[selectedTemplate]?.name};</code>)
                </span>
              </label>
            </form>
          </div>
        </div>
      )}

      {/* SECTION 2: CRATES & CARGO.TOML DEPENDENCIES */}
      {activeSection === 'crates' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Categories */}
          <div className="p-3 border-b border-neutral-800 bg-[#141820] space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search popular crates (tokio, serde, rand, itertools)..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-700 rounded text-xs text-neutral-200 focus:outline-none focus:ring-1 focus:ring-[#DE3804]"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-neutral-700 text-white'
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Crates Grid */}
          <div className="flex-1 p-3 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filteredCrates.map((crate) => {
              const isAdded = addedCrateNames.has(crate.name);

              return (
                <div
                  key={crate.name}
                  className={`p-3 rounded-lg border transition-all theme-card ${
                    isAdded
                      ? 'bg-neutral-900 border-amber-500/40 shadow-xs'
                      : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-neutral-100 text-sm">
                          {crate.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                          v{crate.version}
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-500">{crate.category}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleCrate(crate)}
                        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          isAdded
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3 h-3 text-amber-400" />
                            <span>Added</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 mb-2 leading-relaxed">
                    {crate.description}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[11px]">
                    <button
                      onClick={() => onInsertImport(crate.importSnippet)}
                      className="flex items-center gap-1 text-[#DE3804] hover:underline font-mono cursor-pointer"
                      title="Insert use statement into main.rs"
                    >
                      <Code className="w-3 h-3" />
                      <span>Insert `use`</span>
                    </button>

                    <a
                      href={`https://crates.io/crates/${crate.name}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-neutral-500 hover:text-neutral-300"
                    >
                      <span>crates.io</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
