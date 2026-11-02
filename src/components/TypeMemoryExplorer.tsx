import React, { useState } from 'react';
import { Cpu, Layers, HelpCircle, Check, AlertTriangle, ShieldCheck, Box } from 'lucide-react';

export const TypeMemoryExplorer: React.FC = () => {
  const [testNumber, setTestNumber] = useState<string>('200');

  const parsedNum = parseFloat(testNumber);
  const isInteger = Number.isInteger(parsedNum);
  const isValid = !isNaN(parsedNum);

  const types = [
    {
      name: 'u8',
      bytes: 1,
      bits: 8,
      min: 0,
      max: 255,
      signed: false,
      useCase: 'RGB screen colors (0-255), single file bytes',
      fits: isValid && isInteger && parsedNum >= 0 && parsedNum <= 255,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < 0
        ? 'Unsigned (u): cannot hold negative numbers'
        : parsedNum > 255
        ? 'Too large: maximum value is 255'
        : null,
    },
    {
      name: 'i8',
      bytes: 1,
      bits: 8,
      min: -128,
      max: 127,
      signed: true,
      useCase: 'Small coordinate offsets, directional steps',
      fits: isValid && isInteger && parsedNum >= -128 && parsedNum <= 127,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < -128
        ? 'Too small: minimum value is -128'
        : parsedNum > 127
        ? 'Too large: maximum value is 127'
        : null,
    },
    {
      name: 'u16',
      bytes: 2,
      bits: 16,
      min: 0,
      max: 65535,
      signed: false,
      useCase: 'Network ports (0 to 65535), screen height in pixels',
      fits: isValid && isInteger && parsedNum >= 0 && parsedNum <= 65535,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < 0
        ? 'Unsigned (u): cannot hold negative numbers'
        : parsedNum > 65535
        ? 'Too large: maximum value is 65,535'
        : null,
    },
    {
      name: 'i16',
      bytes: 2,
      bits: 16,
      min: -32768,
      max: 32767,
      signed: true,
      useCase: '16-bit audio samples, retro game coordinates',
      fits: isValid && isInteger && parsedNum >= -32768 && parsedNum <= 32767,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < -32768
        ? 'Too small: minimum is -32,768'
        : parsedNum > 32767
        ? 'Too large: maximum is 32,767'
        : null,
    },
    {
      name: 'i32 (Default)',
      bytes: 4,
      bits: 32,
      min: -2147483648,
      max: 2147483647,
      signed: true,
      useCase: 'Standard everyday numbers, game scores, loop counters',
      fits: isValid && isInteger && parsedNum >= -2147483648 && parsedNum <= 2147483647,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < -2147483648
        ? 'Too small: minimum is -2.1 Billion'
        : parsedNum > 2147483647
        ? 'Too large: maximum is 2.1 Billion'
        : null,
    },
    {
      name: 'u64',
      bytes: 8,
      bits: 64,
      min: 0,
      max: 18446744073709551615,
      signed: false,
      useCase: 'Timestamps in nanoseconds, hard drive sizes in bytes',
      fits: isValid && isInteger && parsedNum >= 0 && parsedNum <= 18446744073709551615,
      overflowReason: !isValid
        ? 'Not a number'
        : !isInteger
        ? 'Cannot hold decimal fractions'
        : parsedNum < 0
        ? 'Unsigned: strictly zero or positive'
        : null,
    },
    {
      name: 'f64',
      bytes: 8,
      bits: 64,
      min: -Infinity,
      max: Infinity,
      signed: true,
      useCase: 'Decimals, physics velocities, percentages (e.g. 3.1415)',
      fits: isValid,
      overflowReason: !isValid ? 'Not a valid number' : null,
    },
  ];

  return (
    <div className="p-5 space-y-6 text-xs text-neutral-200 select-text">
      {/* Introduction Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-[#1c1815] border border-neutral-800 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-amber-400">
          <Box className="w-4 h-4 text-[#DE3804]" />
          <span>The "Box Size" & Memory Simulator</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          Why doesn't Rust just have a single <code className="font-mono text-amber-300 font-semibold">number</code> type? 
          Because computers aren't magic—they are physical silicon chips with physical storage cubbies! 
          Type any number below to see which box size can hold it and why smaller boxes make programs 10x faster.
        </p>
      </div>

      {/* Interactive Input Bar */}
      <div className="p-4 rounded-lg bg-neutral-900 border border-neutral-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-neutral-200 text-xs">
            Test a Number to Test Box Capacities:
          </label>
          <div className="flex items-center gap-1.5">
            {['200', '-25', '300', '65000', '3.14', '1000000'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setTestNumber(preset)}
                className="px-2 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={testNumber}
            onChange={(e) => setTestNumber(e.target.value)}
            placeholder="Type any number, e.g. 200, -10, 300, 3.14..."
            className="flex-1 px-3.5 py-2 bg-black border border-neutral-700 rounded-lg text-sm font-mono text-neutral-100 focus:outline-none focus:ring-2 focus:ring-[#DE3804]"
          />
        </div>
      </div>

      {/* Box Results Comparison Grid */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Memory Box Results for: <span className="font-mono text-white text-sm">{testNumber}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {types.map((t) => (
            <div
              key={t.name}
              className={`p-3.5 rounded-lg border transition-all ${
                t.fits
                  ? 'bg-neutral-900/90 border-emerald-500/40 shadow-xs'
                  : 'bg-neutral-900/40 border-neutral-800/80 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-neutral-100">{t.name}</span>
                    <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-1.5 py-0.5 rounded">
                      {t.bytes} {t.bytes === 1 ? 'Byte' : 'Bytes'} ({t.bits} bits)
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 mt-0.5 block">{t.useCase}</span>
                </div>

                <div className="shrink-0">
                  {t.fits ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                      <Check className="w-3.5 h-3.5" />
                      <span>Fits!</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Overflows</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Status explanation */}
              <div className="pt-2 border-t border-neutral-800/80 text-[11px] leading-relaxed">
                {t.fits ? (
                  <div className="text-emerald-400/90 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                    <span>Safe to store without truncating or corrupting memory.</span>
                  </div>
                ) : (
                  <div className="text-red-400/90 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>Why it fails: {t.overflowReason}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Deep Dive FAQ for Beginners */}
      <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
        <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-[#DE3804]" />
          <span>Beginner FAQ: Why not just use `i64` for everything?</span>
        </h4>

        <div className="space-y-2 text-xs text-neutral-300 leading-relaxed font-sans">
          <p>
            <strong>"If `i64` fits numbers up to 18 quintillion, why don't I just use `i64` for all my variables?"</strong>
          </p>
          <p className="text-neutral-400">
            Great question! In Python or JavaScript, you are forced to use big 64-bit numbers for everything whether you need them or not.
          </p>
          <p className="text-neutral-400">
            In Rust (which is used to build operating systems, browsers, game engines, and rockets):
          </p>
          <ul className="list-disc list-inside space-y-1 text-neutral-300 pl-2">
            <li>
              <strong>Memory Waste:</strong> An image with 10 million pixels uses <strong>10 Megabytes</strong> if each color is a <code>u8</code> (1 byte). If you used <code>i64</code> (8 bytes), that same picture would use <strong>80 Megabytes</strong>!
            </li>
            <li>
              <strong>CPU Cache Speed:</strong> Modern processors have tiny ultra-fast memory caches (L1/L2 cache). The smaller your data types, the more items the CPU can crunch in a single clock cycle.
            </li>
            <li>
              <strong>Bug Prevention:</strong> By declaring an age as <code>u8</code>, the compiler will literally stop anyone from entering an age of <code>-5</code> or <code>10,000</code> before your program even launches!
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
