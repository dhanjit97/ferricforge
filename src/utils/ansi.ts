export interface AnsiSpan {
  text: string;
  style: {
    color?: string;
    fontWeight?: string;
    textDecoration?: string;
  };
}

const ANSI_COLORS: Record<number, string> = {
  30: '#64748b', // Black / slate
  31: '#ef4444', // Red
  32: '#22c55e', // Green
  33: '#eab308', // Yellow
  34: '#3b82f6', // Blue
  35: '#a855f7', // Magenta
  36: '#06b6d4', // Cyan
  37: '#f8fafc', // White
  90: '#94a3b8', // Bright Black
  91: '#f87171', // Bright Red
  92: '#4ade80', // Bright Green
  93: '#fde047', // Bright Yellow
  94: '#60a5fa', // Bright Blue
  95: '#c084fc', // Bright Magenta
  96: '#22d3ee', // Bright Cyan
  97: '#ffffff', // Bright White
};

export function parseAnsiToSpans(raw: string): AnsiSpan[] {
  if (!raw) return [];

  // Match ANSI escape sequences: \x1b[...m or \u001b[...m
  const regex = /\x1b\[([0-9;]*)m/g;
  const spans: AnsiSpan[] = [];
  let lastIndex = 0;

  let currentColor: string | undefined = undefined;
  let isBold = false;
  let isUnderline = false;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    const textChunk = raw.slice(lastIndex, match.index);
    if (textChunk) {
      spans.push({
        text: textChunk,
        style: {
          color: currentColor,
          fontWeight: isBold ? '600' : 'normal',
          textDecoration: isUnderline ? 'underline' : 'none',
        },
      });
    }

    const codes = match[1] ? match[1].split(';').map(Number) : [0];
    for (const code of codes) {
      if (code === 0) {
        currentColor = undefined;
        isBold = false;
        isUnderline = false;
      } else if (code === 1) {
        isBold = true;
      } else if (code === 4) {
        isUnderline = true;
      } else if (ANSI_COLORS[code]) {
        currentColor = ANSI_COLORS[code];
      }
    }

    lastIndex = regex.lastIndex;
  }

  const remaining = raw.slice(lastIndex);
  if (remaining) {
    spans.push({
      text: remaining,
      style: {
        color: currentColor,
        fontWeight: isBold ? '600' : 'normal',
        textDecoration: isUnderline ? 'underline' : 'none',
      },
    });
  }

  return spans;
}
