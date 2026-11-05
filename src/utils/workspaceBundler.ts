import { WorkspaceFile, ParsedDiagnostic } from '../types/rust';

export interface LineMapping {
  bundledLine: number;
  filePath: string;
  originalLine: number;
}

// Shape of a workspace file as it arrives from an untrusted source (URL hash).
interface RawWorkspaceFile {
  p?: string;
  path?: string;
  c?: string;
  content?: string;
}

export function getModuleNameFromPath(path: string): string {
  const fileName = path.split('/').pop() || path;
  return fileName.replace(/\.rs$/, '');
}

export function getModDeclarations(mainContent: string): string[] {
  const matches: string[] = [];
  const regex = /(?:pub\s+)?mod\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/g;
  let match;
  while ((match = regex.exec(mainContent)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

export function hasModDeclaration(mainContent: string, modName: string): boolean {
  const regex = new RegExp(`(?:pub\\s+)?mod\\s+${modName}\\s*;`);
  return regex.test(mainContent);
}

export function addModDeclaration(mainContent: string, modName: string): string {
  if (hasModDeclaration(mainContent, modName)) {
    return mainContent;
  }

  const lines = mainContent.split('\n');
  let insertIdx = 0;

  // Find last existing `mod ...;` or `use ...;` declaration, or after initial doc comments
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('mod ') || trimmed.startsWith('pub mod ')) {
      insertIdx = i + 1;
    } else if (trimmed.startsWith('use ') && insertIdx === 0) {
      insertIdx = i;
    }
  }

  // If no mod or use found, insert after top comments/attributes
  if (insertIdx === 0) {
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('#!')) {
        continue;
      }
      insertIdx = i;
      break;
    }
  }

  lines.splice(insertIdx, 0, `mod ${modName};`);
  return lines.join('\n');
}

export function removeModDeclaration(mainContent: string, modName: string): string {
  const regex = new RegExp(`^\\s*(?:pub\\s+)?mod\\s+${modName}\\s*;\\n?`, 'gm');
  return mainContent.replace(regex, '');
}

export function bundleWorkspace(files: WorkspaceFile[]): {
  bundledCode: string;
  lineMappings: LineMapping[];
} {
  const mainFile = files.find((f) => f.path === 'src/main.rs') || files.find((f) => f.path.endsWith('.rs')) || files[0];
  const moduleFiles = files.filter(
    (f) => f.path.endsWith('.rs') && f.path !== 'src/main.rs' && f.path !== 'Cargo.toml'
  );

  if (moduleFiles.length === 0) {
    const lines = (mainFile?.content || '').split('\n');
    const lineMappings: LineMapping[] = lines.map((_, idx) => ({
      bundledLine: idx + 1,
      filePath: mainFile.path,
      originalLine: idx + 1,
    }));
    return {
      bundledCode: mainFile.content,
      lineMappings,
    };
  }

  const lineMappings: LineMapping[] = [];
  const bundledLines: string[] = [];

  // Map of module name to WorkspaceFile
  const modMap = new Map<string, WorkspaceFile>();
  moduleFiles.forEach((file) => {
    const modName = getModuleNameFromPath(file.path);
    modMap.set(modName, file);
  });

  const processedMods = new Set<string>();

  // Process main.rs line by line
  const mainLines = mainFile.content.split('\n');

  for (let i = 0; i < mainLines.length; i++) {
    const rawLine = mainLines[i];
    const modMatch = rawLine.match(/^\s*(?:pub\s+)?mod\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*;/);

    if (modMatch && modMap.has(modMatch[1])) {
      const modName = modMatch[1];
      const targetModFile = modMap.get(modName)!;
      processedMods.add(modName);

      // Open inline module block
      const headerLine = `pub mod ${modName} {`;
      bundledLines.push(headerLine);
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: mainFile.path,
        originalLine: i + 1,
      });

      // Insert module file lines
      const modLines = targetModFile.content.split('\n');
      for (let m = 0; m < modLines.length; m++) {
        bundledLines.push(modLines[m]);
        lineMappings.push({
          bundledLine: bundledLines.length,
          filePath: targetModFile.path,
          originalLine: m + 1,
        });
      }

      // Close module block
      bundledLines.push('}');
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: targetModFile.path,
        originalLine: modLines.length,
      });
    } else {
      bundledLines.push(rawLine);
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: mainFile.path,
        originalLine: i + 1,
      });
    }
  }

  // Any module files not explicitly declared with `mod <name>;` in main.rs
  // will be auto-appended as inline modules so user modules are always accessible
  for (const [modName, file] of modMap.entries()) {
    if (!processedMods.has(modName)) {
      bundledLines.push(`#[allow(dead_code)]`);
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: file.path,
        originalLine: 1,
      });

      bundledLines.push(`pub mod ${modName} {`);
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: file.path,
        originalLine: 1,
      });

      const modLines = file.content.split('\n');
      for (let m = 0; m < modLines.length; m++) {
        bundledLines.push(modLines[m]);
        lineMappings.push({
          bundledLine: bundledLines.length,
          filePath: file.path,
          originalLine: m + 1,
        });
      }

      bundledLines.push('}');
      lineMappings.push({
        bundledLine: bundledLines.length,
        filePath: file.path,
        originalLine: modLines.length,
      });
    }
  }

  return {
    bundledCode: bundledLines.join('\n'),
    lineMappings,
  };
}

export function mapDiagnosticToWorkspace(
  diag: ParsedDiagnostic,
  lineMappings: LineMapping[]
): ParsedDiagnostic {
  const match = lineMappings.find((m) => m.bundledLine === diag.line);
  if (match) {
    return {
      ...diag,
      file: match.filePath,
      line: match.originalLine,
    };
  }
  return {
    ...diag,
    file: 'src/main.rs',
  };
}

const RUST_RESERVED_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern',
  'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
  'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static',
  'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where',
  'while', 'async', 'await', 'dyn'
]);

export function isValidModuleName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Module name cannot be empty' };
  }
  if (trimmed.length > 32) {
    return { valid: false, error: 'Module name cannot exceed 32 characters' };
  }
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed)) {
    return { valid: false, error: 'Module name must contain only letters, numbers, and underscores, and cannot start with a number' };
  }
  if (RUST_RESERVED_KEYWORDS.has(trimmed)) {
    return { valid: false, error: `'${trimmed}' is a reserved Rust keyword` };
  }
  return { valid: true };
}

export function isValidWorkspacePath(filePath: string): boolean {
  if (typeof filePath !== 'string' || filePath.length > 80) return false;
  // Prevent path traversal, null bytes, special characters
  if (filePath.includes('..') || filePath.includes('\\') || filePath.includes('\0')) return false;
  if (filePath === 'Cargo.toml') return true;
  if (/^src\/[a-zA-Z_][a-zA-Z0-9_]*\.rs$/.test(filePath)) return true;
  return false;
}

export function sanitizeWorkspaceFiles(
  rawList: unknown,
  fallbackMainContent: string,
  fallbackCargoToml: string
): WorkspaceFile[] {
  const MAX_FILES = 20;
  const MAX_CONTENT_LENGTH = 150000; // 150KB per file

  if (!Array.isArray(rawList) || rawList.length === 0) {
    return [
      { path: 'src/main.rs', name: 'main.rs', content: fallbackMainContent, isEntry: true },
      { path: 'Cargo.toml', name: 'Cargo.toml', content: fallbackCargoToml },
    ];
  }

  const sanitized: WorkspaceFile[] = [];
  const seenPaths = new Set<string>();

  for (const item of rawList.slice(0, MAX_FILES)) {
    if (!item || typeof item !== 'object') continue;
    const raw = item as RawWorkspaceFile;
    const path =
      typeof raw.p === 'string'
        ? raw.p
        : typeof raw.path === 'string'
          ? raw.path
          : '';
    const content =
      typeof raw.c === 'string'
        ? raw.c
        : typeof raw.content === 'string'
          ? raw.content
          : '';

    if (!isValidWorkspacePath(path) || seenPaths.has(path)) continue;

    seenPaths.add(path);
    const safeContent = content.slice(0, MAX_CONTENT_LENGTH);
    const name = path.split('/').pop() || path;

    sanitized.push({
      path,
      name,
      content: safeContent,
      isEntry: path === 'src/main.rs',
    });
  }

  // Ensure src/main.rs exists
  if (!sanitized.some((f) => f.path === 'src/main.rs')) {
    sanitized.unshift({
      path: 'src/main.rs',
      name: 'main.rs',
      content: fallbackMainContent,
      isEntry: true,
    });
  }

  // Ensure Cargo.toml exists
  if (!sanitized.some((f) => f.path === 'Cargo.toml')) {
    sanitized.push({
      path: 'Cargo.toml',
      name: 'Cargo.toml',
      content: fallbackCargoToml,
    });
  }

  return sanitized;
}

