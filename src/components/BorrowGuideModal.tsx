import React from 'react';
import { BookMarked, X, Play, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface BorrowGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadSnippet: (code: string) => void;
}

export const BorrowGuideModal: React.FC<BorrowGuideModalProps> = ({
  isOpen,
  onClose,
  onLoadSnippet,
}) => {
  if (!isOpen) return null;

  const topics = [
    {
      title: '1. The Ownership Principle',
      concept: 'Each value in Rust has an owner. There can only be one owner at a time. When the owner goes out of scope, the value is dropped.',
      rule: 'Values without the Copy trait are MOVED on assignment or function calls.',
      exampleCode: `fn main() {
    let s1 = String::from("Ferris");
    let s2 = s1; // Ownership moved to s2!
    // println!("{}", s1); // Error E0382! s1 is no longer valid.
    println!("s2 owns the data: {}", s2);
}`,
    },
    {
      title: '2. The Aliasing XOR Mutability Rule',
      concept: 'At any given time, you can have EITHER any number of immutable references (&T), OR exactly one mutable reference (&mut T).',
      rule: 'Never both at the same time. This mathematically guarantees data race freedom at compile time.',
      exampleCode: `fn main() {
    let mut data = vec![1, 2, 3];
    let r1 = &data; // immutable borrow
    let r2 = &data; // another immutable borrow - OK!
    println!("Readers: {:?}, {:?}", r1, r2);

    // After r1 and r2 are no longer used (Non-Lexical Lifetimes):
    let r_mut = &mut data;
    r_mut.push(4);
    println!("Modified exclusively: {:?}", r_mut);
}`,
    },
    {
      title: '3. Lifetimes (\'a) and References',
      concept: 'Lifetimes ensure that references never outlive the data they point to (dangling pointer prevention).',
      rule: 'Lifetimes are descriptive, not prescriptive. They inform rustc of the relationship between input and output references.',
      exampleCode: `// Function returning the longer string slice with lifetime 'a
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}

fn main() {
    let string1 = String::from("long string is long");
    let result;
    {
        let string2 = String::from("xyz");
        result = longest(string1.as_str(), string2.as_str());
        println!("The longest string is '{}'", result);
    }
}`,
    },
    {
      title: '4. Smart Pointers: Rc, Arc, RefCell, Mutex',
      concept: 'When single ownership is too restrictive: Rc/Arc enable multiple owners; RefCell/Mutex enable interior mutability.',
      rule: 'Use Arc + Mutex for multithreaded sharing; use Rc + RefCell for single-threaded graph/tree structures.',
      exampleCode: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let val = Arc::new(Mutex::new(10));
    let val_clone = Arc::clone(&val);

    let handle = thread::spawn(move || {
        let mut guard = val_clone.lock().unwrap();
        *guard += 5;
    });

    handle.join().unwrap();
    println!("Final value: {}", *val.lock().unwrap());
}`,
    },
  ];

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-[#121214] border border-neutral-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden select-none">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-800 bg-[#16161a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-md bg-[#DE3804]/20 text-[#DE3804]">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-neutral-100">The Borrow Checker Interactive Guide</h3>
              <p className="text-xs text-neutral-400">Master Rust's core ownership and lifetime invariants</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-6 text-xs select-text">
          {topics.map((topic, idx) => (
            <div key={idx} className="p-4 rounded-lg bg-neutral-900/90 border border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-neutral-100">{topic.title}</h4>
                <button
                  onClick={() => {
                    onLoadSnippet(topic.exampleCode);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DE3804] hover:bg-[#C23103] text-white rounded text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Try in Editor</span>
                </button>
              </div>

              <p className="text-neutral-300 leading-relaxed">{topic.concept}</p>
              <div className="p-2 bg-neutral-800/60 rounded border border-neutral-700/60 text-amber-300 font-mono text-[11px]">
                Invariant: {topic.rule}
              </div>

              <pre className="p-3 bg-black/70 border border-neutral-800 rounded font-mono text-[11px] text-neutral-300 overflow-x-auto whitespace-pre">
                {topic.exampleCode}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
