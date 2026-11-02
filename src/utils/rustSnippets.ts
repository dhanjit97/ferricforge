import { RustSnippet } from '../types/rust';

export const RUST_SNIPPETS: RustSnippet[] = [
  {
    id: 'hello-world',
    title: 'Hello Rustacean & Pattern Matching',
    category: 'Basics',
    description: 'Idiomatic greeting with pattern matching, custom enums, and clean display formatting.',
    edition: '2021',
    code: `#[derive(Debug)]
enum Greeter {
    Human(String),
    Crab { name: String, shell_size: u8 },
    Robot(u64),
}

impl Greeter {
    fn speak(&self) {
        match self {
            Greeter::Human(name) => println!("Hello, {}! Welcome to Rust.", name),
            Greeter::Crab { name, shell_size } => {
                println!("Ferris the Crab (name: {}, shell: {}cm) clacks claws!", name, shell_size);
            }
            Greeter::Robot(id) => println!("Beep boop! Unit #{} online.", id),
        }
    }
}

fn main() {
    let crew = vec![
        Greeter::Human("Alice".into()),
        Greeter::Crab { name: "Ferris".into(), shell_size: 42 },
        Greeter::Robot(404),
    ];

    println!("--- Rust Playground Pro Greeting ---");
    for member in &crew {
        member.speak();
    }
}
`,
  },
  {
    id: 'borrow-checker-demo',
    title: 'Borrow Checker & Ownership Flow',
    category: 'Borrowing & Lifetimes',
    description: 'Demonstrating how move semantics, borrowing, and references prevent data races at compile time.',
    edition: '2021',
    code: `// Ownership Demonstration:
// In Rust, each value has a single owner. When moved, the previous owner cannot use it.

fn take_ownership(data: String) {
    println!("Consumed into function: {}", data);
} // ` + '`data` is dropped here, deallocating the heap memory' + `

fn borrow_immutable(data: &String) {
    println!("Borrowed immutably (length: {}): {}", data.len(), data);
}

fn borrow_mutable(data: &mut String) {
    data.push_str(" [Modified safely in-place]");
}

fn main() {
    let mut greeting = String::from("Hello, Borrow Checker");

    // 1. Immutable borrow: can have multiple active readers
    borrow_immutable(&greeting);
    borrow_immutable(&greeting);

    // 2. Mutable borrow: exclusive access guaranteed
    borrow_mutable(&mut greeting);
    println!("After mut borrow: {}", greeting);

    // 3. Move semantics:
    take_ownership(greeting);

    // Try uncommenting the next line to trigger rustc error E0382:
    // println!("Attempting to use moved value: {}", greeting);
}
`,
  },
  {
    id: 'async-tokio',
    title: 'Async Tokio & MPSC Channels',
    category: 'Async & Concurrency',
    description: 'Concurrent asynchronous workers communicating over multi-producer, single-consumer channels.',
    edition: '2021',
    code: `// Note: 'tokio' is available in the playground environment!
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};

#[derive(Debug)]
struct WorkItem {
    id: u32,
    payload: String,
}

#[tokio::main]
async fn main() {
    println!("Starting asynchronous task processing with Tokio channels...");

    // Channel buffer capacity of 16
    let (tx, mut rx) = mpsc::channel::<WorkItem>(16);

    // Spawn 3 concurrent producer tasks
    for worker_id in 1..=3 {
        let tx_clone = tx.clone();
        tokio::spawn(async move {
            for task_no in 1..=2 {
                sleep(Duration::from_millis(50 * worker_id)).await;
                let item = WorkItem {
                    id: worker_id * 10 + task_no,
                    payload: format!("Processed by Worker #{}", worker_id),
                };
                let _ = tx_clone.send(item).await;
            }
        });
    }

    // Drop original sender so receiver knows when all producers finish
    drop(tx);

    let mut count = 0;
    while let Some(item) = rx.recv().await {
        println!("  -> Received: [Task #{}] {}", item.id, item.payload);
        count += 1;
    }

    println!("All {} async tasks gathered cleanly with zero data races!", count);
}
`,
  },
  {
    id: 'zero-cost-iterators',
    title: 'Zero-Cost Functional Iterators',
    category: 'Idioms',
    description: 'Declarative iterator chains compiled down to the exact equivalent of tight handwritten loops.',
    edition: '2021',
    code: `fn main() {
    let numbers = vec![1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    // Functional pipeline: filter even, square, sum
    let sum_of_even_squares: u64 = numbers
        .iter()
        .filter(|&&x| x % 2 == 0)
        .map(|&x| (x * x) as u64)
        .sum();

    println!("Sum of squares of evens: {}", sum_of_even_squares);

    // Chunking, folding, and zip combinations
    let words = vec!["Rust", "is", "fast", "and", "memory-safe"];
    let indexed_summary = words
        .iter()
        .enumerate()
        .fold(String::new(), |mut acc, (i, word)| {
            if !acc.is_empty() {
                acc.push_str(" · ");
            }
            acc.push_str(&format!("{}:{}", i + 1, word));
            acc
        });

    println!("Summary: {}", indexed_summary);
}
`,
  },
  {
    id: 'smart-pointers',
    title: 'Smart Pointers: Arc & Mutex Shared State',
    category: 'Borrowing & Lifetimes',
    description: 'Thread-safe atomic reference counting (Arc) combined with mutual exclusion lock (Mutex).',
    edition: '2021',
    code: `use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    // Arc (Atomic Reference Counter) allows multi-thread ownership
    // Mutex guarantees interior mutable access
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for i in 0..5 {
        let counter_clone = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter_clone.lock().unwrap();
            *num += 1;
            println!("Thread {} incremented counter to {}", i, *num);
        });
        handles.push(handle);
    }

    // Wait for all threads to finish
    for handle in handles {
        handle.join().unwrap();
    }

    println!("Final shared counter value: {}", *counter.lock().unwrap());
}
`,
  },
  {
    id: 'simd-asm-optimization',
    title: 'SIMD & Compiler Assembly Inspector',
    category: 'Performance',
    description: 'Inspect the generated ASM in Release mode to see LLVM auto-vectorize loops into AVX2/SSE instructions.',
    edition: '2021',
    mode: 'release',
    code: `// Switch Target to "ASM" in Release mode to observe auto-vectorization!
// The compiler automatically converts this loop into SIMD vector instructions (ymm/xmm registers).

#[no_mangle]
pub fn add_vectors(a: &[f32], b: &[f32], out: &mut [f32]) {
    assert_eq!(a.len(), b.len());
    assert_eq!(a.len(), out.len());

    for i in 0..a.len() {
        out[i] = a[i] + b[i];
    }
}

pub fn compute_dot_product(x: &[f32], y: &[f32]) -> f32 {
    x.iter().zip(y.iter()).map(|(a, b)| a * b).sum()
}

fn main() {
    let a = [1.0, 2.0, 3.0, 4.0];
    let b = [5.0, 6.0, 7.0, 8.0];
    let mut result = [0.0; 4];

    add_vectors(&a, &b, &mut result);
    println!("Vector sum: {:?}", result);
    println!("Dot product: {}", compute_dot_product(&a, &b));
}
`,
  },
  {
    id: 'serde-json',
    title: 'Serde JSON Serialization',
    category: 'Idioms',
    description: 'Type-safe JSON serialization and deserialization with struct derives and custom attribute tags.',
    edition: '2021',
    code: `use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug)]
struct ServerConfig {
    host: String,
    port: u16,
    #[serde(default = "default_max_connections")]
    max_connections: u32,
    enable_tls: bool,
    tags: Vec<String>,
}

fn default_max_connections() -> u32 {
    1024
}

fn main() {
    let config = ServerConfig {
        host: "127.0.0.1".into(),
        port: 8080,
        max_connections: 4096,
        enable_tls: true,
        tags: vec!["production".into(), "api".into()],
    };

    // Serialize to pretty JSON
    let serialized = serde_json::to_string_pretty(&config).unwrap();
    println!("Serialized JSON:\n{}", serialized);

    // Deserialize back into strongly typed Rust struct
    let deserialized: ServerConfig = serde_json::from_str(&serialized).unwrap();
    println!("\nDeserialized struct host: {}, port: {}", deserialized.host, deserialized.port);
}
`,
  },
  {
    id: 'error-handling',
    title: 'Robust Error Handling with Result & ?',
    category: 'Idioms',
    description: 'Custom enum error types, From trait implementations, and early return with ? operator.',
    edition: '2021',
    code: `use std::fmt;

#[derive(Debug)]
enum MathError {
    DivisionByZero,
    NegativeSquareRoot,
    Overflow,
}

impl fmt::Display for MathError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MathError::DivisionByZero => write!(f, "Cannot divide by zero"),
            MathError::NegativeSquareRoot => write!(f, "Cannot calculate square root of negative number"),
            MathError::Overflow => write!(f, "Numerical calculation overflowed bounds"),
        }
    }
}

impl std::error::Error for MathError {}

fn safe_divide(a: f64, b: f64) -> Result<f64, MathError> {
    if b == 0.0 {
        Err(MathError::DivisionByZero)
    } else {
        Ok(a / b)
    }
}

fn safe_sqrt(x: f64) -> Result<f64, MathError> {
    if x < 0.0 {
        Err(MathError::NegativeSquareRoot)
    } else {
        Ok(x.sqrt())
    }
}

// Composition using the '?' operator
fn compute_pipeline(a: f64, b: f64) -> Result<f64, MathError> {
    let div = safe_divide(a, b)?;
    let result = safe_sqrt(div)?;
    Ok(result)
}

fn main() {
    let test_cases = [(16.0, 4.0), (10.0, 0.0), (-25.0, 1.0)];

    for (a, b) in test_cases {
        match compute_pipeline(a, b) {
            Ok(val) => println!("compute_pipeline({}, {}) = {:.4}", a, b, val),
            Err(err) => println!("compute_pipeline({}, {}) failed: {}", a, b, err),
        }
    }
}
`,
  },
  {
    id: 'cargo-tests',
    title: 'Built-in Unit Testing Suite',
    category: 'Basics',
    description: 'Run with "cargo test" or click Run to see testing status assertions.',
    edition: '2021',
    code: `pub fn fibonacci(n: u32) -> u64 {
    match n {
        0 => 0,
        1 => 1,
        _ => {
            let mut a = 0;
            let mut b = 1;
            for _ in 2..=n {
                let next = a + b;
                a = b;
                b = next;
            }
            b
        }
    }
}

fn main() {
    println!("Fibonacci(10) = {}", fibonacci(10));
    println!("Run 'cargo test' target to execute unit tests!");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_base_cases() {
        assert_eq!(fibonacci(0), 0);
        assert_eq!(fibonacci(1), 1);
    }

    #[test]
    fn test_fib_ten() {
        assert_eq!(fibonacci(10), 55);
    }

    #[test]
    fn test_large_value() {
        assert_eq!(fibonacci(20), 6765);
    }
}
`,
  },
];
