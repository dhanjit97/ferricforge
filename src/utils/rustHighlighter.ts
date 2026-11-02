export interface SyntaxToken {
  text: string;
  type: 'keyword' | 'type' | 'macro' | 'string' | 'comment' | 'number' | 'attribute' | 'lifetime' | 'operator' | 'punctuation' | 'plain';
}

const RUST_KEYWORDS = new Set([
  'as', 'async', 'await', 'break', 'const', 'continue', 'crate', 'dyn', 'else', 'enum',
  'extern', 'false', 'fn', 'for', 'if', 'impl', 'in', 'let', 'loop', 'match',
  'mod', 'move', 'mut', 'pub', 'ref', 'return', 'self', 'Self', 'static', 'struct',
  'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where', 'while'
]);

const RUST_TYPES = new Set([
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize',
  'u8', 'u16', 'u32', 'u64', 'u128', 'usize',
  'f32', 'f64', 'bool', 'char', 'str',
  'String', 'Vec', 'Option', 'Result', 'Some', 'None', 'Ok', 'Err',
  'Box', 'Rc', 'Arc', 'Mutex', 'RefCell', 'Duration', 'HashMap', 'HashSet'
]);

export function tokenizeRustLine(line: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = [];
  let i = 0;
  const n = line.length;

  while (i < n) {
    // Comment
    if (line.slice(i, i + 2) === '//') {
      tokens.push({ text: line.slice(i), type: 'comment' });
      break;
    }

    // Attribute: #[...] or #![...]
    if (line[i] === '#' && (line[i + 1] === '[' || (line[i + 1] === '!' && line[i + 2] === '['))) {
      let end = line.indexOf(']', i);
      if (end === -1) end = n;
      else end += 1;
      tokens.push({ text: line.slice(i, end), type: 'attribute' });
      i = end;
      continue;
    }

    // String literal
    if (line[i] === '"') {
      let j = i + 1;
      while (j < n) {
        if (line[j] === '\\') {
          j += 2;
        } else if (line[j] === '"') {
          j++;
          break;
        } else {
          j++;
        }
      }
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
      continue;
    }

    // Character or lifetime: 'a, 'static, 'c'
    if (line[i] === '\'') {
      const lifetimeMatch = line.slice(i).match(/^'([a-zA-Z_][a-zA-Z0-9_]*)/);
      if (lifetimeMatch && line[i + lifetimeMatch[0].length] !== '\'') {
        tokens.push({ text: lifetimeMatch[0], type: 'lifetime' });
        i += lifetimeMatch[0].length;
        continue;
      }
      // Char literal
      let j = i + 1;
      if (j < n && line[j] === '\\') j += 2;
      else if (j < n) j += 1;
      if (j < n && line[j] === '\'') j += 1;
      tokens.push({ text: line.slice(i, j), type: 'string' });
      i = j;
      continue;
    }

    // Number literal
    if (/[0-9]/.test(line[i]) && (i === 0 || /[^a-zA-Z_]/.test(line[i - 1]))) {
      const numMatch = line.slice(i).match(/^(?:0x[0-9a-fA-F_]+|0b[01_]+|0o[0-7_]+|[0-9_]+(?:\.[0-9_]+)?(?:[eE][+-]?[0-9_]+)?(?:[iuf](?:8|16|32|64|128|size))?)/);
      if (numMatch) {
        tokens.push({ text: numMatch[0], type: 'number' });
        i += numMatch[0].length;
        continue;
      }
    }

    // Identifier, keyword, type, or macro
    if (/[a-zA-Z_]/.test(line[i])) {
      const wordMatch = line.slice(i).match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
      if (wordMatch) {
        const word = wordMatch[0];
        let wordEnd = i + word.length;

        // Check if followed by ! for macro
        if (line[wordEnd] === '!') {
          tokens.push({ text: line.slice(i, wordEnd + 1), type: 'macro' });
          i = wordEnd + 1;
          continue;
        }

        if (RUST_KEYWORDS.has(word)) {
          tokens.push({ text: word, type: 'keyword' });
        } else if (RUST_TYPES.has(word) || /^[A-Z]/.test(word)) {
          tokens.push({ text: word, type: 'type' });
        } else {
          tokens.push({ text: word, type: 'plain' });
        }
        i = wordEnd;
        continue;
      }
    }

    // Operators and punctuation
    const char = line[i];
    if ('{}[]();,'.includes(char)) {
      tokens.push({ text: char, type: 'punctuation' });
    } else if ('+-*/%&|^!=<>?:.'.includes(char)) {
      tokens.push({ text: char, type: 'operator' });
    } else {
      tokens.push({ text: char, type: 'plain' });
    }
    i++;
  }

  return tokens;
}
