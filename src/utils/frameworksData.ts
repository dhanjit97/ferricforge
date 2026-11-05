import { FrameworkGuide } from '../types/frameworks';

export const FRAMEWORK_GUIDES: FrameworkGuide[] = [
  // ==========================================
  // 1. AXUM & TOWER (Web & Microservices)
  // ==========================================
  {
    id: 'axum',
    name: 'Axum & Tower',
    category: 'Web & APIs',
    badge: 'Tokio Ecosystem Standard',
    crates: ['axum = "0.7"', 'tokio = { version = "1.0", features = ["full"] }', 'tower-http = "0.5"', 'serde = { version = "1.0", features = ["derive"] }'],
    tagline: 'Ergonomic, modular web framework built on top of Hyper, Tower, and Tokio with zero-cost extractors.',
    summary:
      'Axum is the premier web backend framework maintained by the Tokio team. Unlike traditional web frameworks that rely on dynamic runtime reflection or heavy macros, Axum achieves high throughput by transforming request handling into strongly-typed Tower Service pipelines.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                                 CLIENT HTTP REQUEST                             |
+---------------------------------------------------------------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |                 HYPER HTTP ENGINE                  |
               | (Parses raw TCP bytes into http::Request<Body>)    |
               +----------------------------------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |              TOWER MIDDLEWARE ONION                |
               | [Compression] -> [RateLimit] -> [AuthGuard] -> ...  |
               +----------------------------------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |               AXUM ROUTER DISPATCH                 |
               | Matches (Method, Path) -> Matched Handler Route     |
               +----------------------------------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |               TYPE-SAFE EXTRACTORS                 |
               | Evaluates: State(db), Path(id), Json(payload)      |
               | * If any extractor fails -> early 400/401 response |
               +----------------------------------------------------+
                                         |
                                         v
               +----------------------------------------------------+
               |                 YOUR HANDLER FN                    |
               | async fn create_user(...) -> impl IntoResponse     |
               +----------------------------------------------------+
                                         |
                                         v
+---------------------------------------------------------------------------------+
|                       CLIENT RECEIVES HTTP 200/201 JSON                         |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Think of Axum as an automated customs security checkpoint: incoming requests must pass through several security stations (Tower middleware). At the baggage counter (Extractors), the inspector unpacks only the exact typed items your handler requested. If a passport is missing (e.g. invalid JSON or missing token), customs sends the traveler back immediately with a 400 Bad Request without ever bothering your business logic function.',
      coreConcepts: [
        {
          concept: 'The Tower Service Trait',
          plainEnglish: 'The universal contract of the Rust network stack.',
          underTheHood:
            'A Tower Service is simply `fn call(&mut self, req: Request) -> Future<Output = Result<Response, Error>>`. Every middleware (CORS, Trace, Timeout, Auth) is just an onion layer wrapping the next Service.',
        },
        {
          concept: 'Extractors (FromRequest & FromRequestParts)',
          plainEnglish: 'Automatic parsing of URLs, headers, and JSON bodies right in your function parameters.',
          underTheHood:
            'Axum handlers are normal Rust functions. Axum uses Rust compile-time trait implementations to run `FromRequestParts` on headers and URI first, and `FromRequest` on the body. If extraction fails, it short-circuits with an HTTP error before your handler code runs.',
        },
        {
          concept: 'State Sharing (State<Arc<AppState>>)',
          plainEnglish: 'How every worker thread safely accesses your database connection pool or cache.',
          underTheHood:
            'Axum passes shared state via `State(state)`. Behind the scenes, `State` clones an `Arc<T>` (Atomic Reference Counter) for each incoming request, ensuring zero global lock contention.',
        },
      ],
      executionSteps: [
        '1. OS receives TCP connection packet via epoll/kqueue.',
        '2. Tokio event loop dispatches connection to Hyper.',
        '3. Hyper parses HTTP headers and delivers `http::Request`.',
        '4. Tower middleware layers execute (logging, CORS, JWT extraction).',
        '5. Axum route tree matches `/api/users/:id`.',
        '6. Extractors parse URI parameters, queries, and JSON body.',
        '7. Your asynchronous handler function executes.',
        '8. Return value converted to HTTP response via `IntoResponse`.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `my_axum_service/
├── Cargo.toml
├── src/
│   ├── main.rs            # Server bootstrap, TCP listener binding, signal shutdown
│   ├── app.rs             # Router composition, middleware stacking, State injection
│   ├── config.rs          # Environment variables parsing (envy, dotenvy)
│   ├── errors.rs          # Centralized AppError enum implementing IntoResponse
│   ├── models/            # Domain entities, DTOs, and Serde structs
│   │   ├── mod.rs
│   │   └── user.rs
│   ├── handlers/          # HTTP request handlers (thin controllers)
│   │   ├── mod.rs
│   │   ├── auth.rs
│   │   └── users.rs
│   ├── services/          # Business logic independent of HTTP protocols
│   │   ├── mod.rs
│   │   └── user_service.rs
│   └── repositories/      # Database queries (SQLx, SeaORM, or In-Memory)
│       ├── mod.rs
│       └── user_repo.rs
└── tests/
    └── api_integration.rs # End-to-end HTTP tests with tower::ServiceExt`,
      architecturalPhilosophy:
        'Always keep HTTP controllers (handlers) razor thin. Handlers should ONLY: 1) extract parameters, 2) call the service layer, and 3) convert domain results into HTTP responses. Never write SQL queries or heavy business validation directly inside Axum handler functions.',
      patterns: [
        {
          name: 'Centralized AppError Enum with IntoResponse',
          whyUseIt:
            'Eliminates repetitive manual HTTP status code wiring. Functions return `Result<T, AppError>` and Rust automatically converts domain errors into clean JSON payloads with appropriate HTTP status codes (404, 401, 500).',
          codeExample: `use axum::{response::{IntoResponse, Response}, http::StatusCode, Json};
use serde_json::json;

pub enum AppError {
    NotFound(String),
    Unauthorized(String),
    ValidationError(String),
    Internal(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::NotFound(msg) => (StatusCode::NOT_FOUND, msg),
            AppError::Unauthorized(msg) => (StatusCode::UNAUTHORIZED, msg),
            AppError::ValidationError(msg) => (StatusCode::BAD_REQUEST, msg),
            AppError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, msg),
        };
        (status, Json(json!({ "error": message }))).into_response()
    }
}`,
        },
        {
          name: 'Extension/State Dependency Injection',
          whyUseIt:
            'Decouples database repositories and third-party clients (Stripe, AWS, Redis) from the request handlers for easy mocking in unit tests.',
          codeExample: `#[derive(Clone)]
pub struct AppState {
    pub db: std::sync::Arc<tokio::sync::RwLock<std::collections::HashMap<u64, String>>>,
}

pub async fn get_user(
    axum::extract::State(state): axum::extract::State<AppState>,
    axum::extract::Path(id): axum::extract::Path<u64>,
) -> Result<String, AppError> {
    let map = state.db.read().await;
    map.get(&id)
        .cloned()
        .ok_or_else(|| AppError::NotFound(format!("User #{} not found", id)))
}`,
        },
      ],
      stateManagement:
        'Store shared resources inside a struct wrapped in `std::sync::Arc` (e.g. `AppState`). Axum clones this state cheaply using atomic reference counting across all spawned worker tasks.',
      errorHandlingAdvice:
        'Avoid `unwrap()` or `expect()` in handlers at all costs—a panic kills the task! Use the `?` operator returning your custom `AppError` enum.',
      testingAdvice:
        'Test your Axum router directly in-memory using `app.oneshot(req).await` without needing to bind to an actual open network port.',
    },
    productionSnippets: [
      {
        title: 'Complete Production-Grade Microservice Router',
        purpose: 'Demonstrates routing, shared state, JSON extraction, custom error responses, and health checks.',
        code: `use std::sync::Arc;
use std::collections::HashMap;

#[derive(Clone, Default)]
pub struct InMemoryDatabase {
    pub users: Arc<std::sync::RwLock<HashMap<u64, String>>>,
}

#[derive(Clone)]
pub struct AppState {
    pub db: InMemoryDatabase,
}

// Router builder
pub fn build_app_router(state: AppState) -> String {
    format!("Router configured with State, /health, /users routes.")
}

fn main() {
    let state = AppState { db: InMemoryDatabase::default() };
    println!("Axum microservice initialized successfully.");
}`,
      },
    ],
    challenge: {
      id: 'ch-axum-router',
      title: 'Challenge: Build an In-Memory Routing Table & Extractor',
      description:
        'Implement a lightweight URL parameter matcher and HTTP status responder simulating Axum extractor mechanics.',
      requirements: [
        'Complete `parse_path_param(pattern: &str, actual: &str) -> Option<u64>` to extract `:id` numbers',
        'Complete `route_dispatch(method: &str, path: &str) -> (u16, &str)` returning 200, 404, or 405 status codes',
      ],
      starterCode: `// Challenge: Simulate Axum Route Matching and Path Extraction
// In Axum, routes like "/users/:id" extract numeric IDs from incoming URLs.

pub fn parse_path_param(pattern: &str, actual: &str) -> Option<u64> {
    // Example: pattern = "/users/:id", actual = "/users/42"
    // Return Some(42) if actual matches pattern prefix and id is valid u64.
    // Return None if mismatch or id cannot be parsed.
    None
}

pub fn route_dispatch(method: &str, path: &str) -> (u16, &'static str) {
    // Endpoints:
    // GET /health -> (200, "OK")
    // GET /api/status -> (200, "OPERATIONAL")
    // POST /api/status -> (405, "METHOD NOT ALLOWED")
    // Anything else -> (404, "NOT FOUND")
    (404, "NOT FOUND")
}

fn main() {
    let id = parse_path_param("/users/:id", "/users/105");
    println!("Extracted user ID: {:?}", id);
    let (status, body) = route_dispatch("GET", "/health");
    println!("Response: {} -> {}", status, body);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_id() {
        assert_eq!(parse_path_param("/users/:id", "/users/42"), Some(42));
        assert_eq!(parse_path_param("/users/:id", "/users/invalid"), None);
        assert_eq!(parse_path_param("/users/:id", "/posts/42"), None);
    }

    #[test]
    fn test_dispatch() {
        assert_eq!(route_dispatch("GET", "/health"), (200, "OK"));
        assert_eq!(route_dispatch("GET", "/api/status"), (200, "OPERATIONAL"));
        assert_eq!(route_dispatch("POST", "/api/status"), (405, "METHOD NOT ALLOWED"));
        assert_eq!(route_dispatch("GET", "/unknown"), (404, "NOT FOUND"));
    }
}
`,
      solutionCode: `pub fn parse_path_param(pattern: &str, actual: &str) -> Option<u64> {
    let prefix = pattern.strip_suffix(":id")?;
    if !actual.starts_with(prefix) {
        return None;
    }
    let remainder = &actual[prefix.len()..];
    remainder.parse::<u64>().ok()
}

pub fn route_dispatch(method: &str, path: &str) -> (u16, &'static str) {
    match (method, path) {
        ("GET", "/health") => (200, "OK"),
        ("GET", "/api/status") => (200, "OPERATIONAL"),
        ("POST", "/api/status") => (405, "METHOD NOT ALLOWED"),
        _ => (404, "NOT FOUND"),
    }
}
`,
      hints: [
        {
          level: 1,
          title: 'Prefix stripping',
          content: 'Use `pattern.strip_suffix(":id")?` to isolate the base route prefix like "/users/".',
        },
        {
          level: 2,
          title: 'Matching remaining slice',
          content: 'Check `actual.starts_with(prefix)` then slice `&actual[prefix.len()..]` and call `.parse::<u64>()`.',
        },
      ],
      verificationCriteria: 'All route dispatches and path parameter extractions pass assertions.',
    },
  },

  // ==========================================
  // 2. TOKIO & ASYNC ARCHITECTURE
  // ==========================================
  {
    id: 'tokio',
    name: 'Tokio Async Runtime',
    category: 'Async & Networking',
    badge: 'Industry Standard Runtime',
    crates: ['tokio = { version = "1.0", features = ["full"] }', 'async-trait = "0.1"', 'futures = "0.3"'],
    tagline: 'Event-driven, non-blocking I/O platform with a multi-threaded work-stealing scheduler.',
    summary:
      'Tokio is the foundation of high-performance Rust networking. Instead of creating a heavy OS thread per connection (which caps out around 10,000 threads), Tokio multiplexes hundreds of thousands of asynchronous green tasks onto a small pool of CPU worker threads using epoll, kqueue, and IOCP.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                                 TOKIO RUNTIME                                   |
|                                                                                 |
|  +---------------------------+             +----------------------------------+  |
|  |     REACTOR (IO DRIVER)   |             |   WORK-STEALING EXECUTOR POOL    |  |
|  | (epoll, kqueue, IOCP)     |             |                                  |  |
|  | Listens to OS socket readiness           |  [Thread 1]   [Thread 2]  ...    |  |
|  | When data arrives -> triggers           |  Local Queue  Local Queue        |  |
|  | Waker notification        |             |  [Task A]     [Task C]           |  |
|  +---------------------------+             |  [Task B]     [Task D] (Steals!) |  |
|                |                           +----------------------------------+  |
|                v                                             ^                   |
|  +---------------------------+                               |                   |
|  |          WAKER            | ------------------------------+                   |
|  | Pushes paused Task back   |                                                   |
|  | into Executor Work Queue  |                                                   |
|  +---------------------------+                                                   |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Imagine a busy restaurant kitchen with 4 master chefs (CPU worker threads). When an order needs 20 minutes in the oven (network socket waiting for data), the chef does NOT stand staring at the oven doing nothing! The chef sets a kitchen timer (the Waker), puts the ticket aside, and immediately starts cooking another meal. When the timer rings (OS says bytes arrived), any available chef grabs the ticket and finishes the dish.',
      coreConcepts: [
        {
          concept: 'Futures are Pull-Based (Lazy)',
          plainEnglish: 'In Rust, async functions do absolutely nothing until you actively `.await` them.',
          underTheHood:
            'Unlike JavaScript promises which start running the instant you construct them, Rust futures are inert state machines. The executor calls `poll(cx)`. The future executes until it hits I/O and returns `Poll::Pending`.',
        },
        {
          concept: 'The 4 Channel Flavors',
          plainEnglish: 'Message pipes for threads to communicate without locking shared data.',
          underTheHood:
            '`mpsc` (Many producers, single consumer queue), `oneshot` (Single message reply channel), `broadcast` (Fan-out to all listeners), `watch` (Latest single value state distribution).',
        },
        {
          concept: 'The Actor Pattern in Rust',
          plainEnglish: 'Eliminate Mutex deadlocks by letting a single task own the state exclusively.',
          underTheHood:
            'Instead of wrapping a database or cache in `Arc<Mutex<T>>` across 100 threads, spawn 1 background task that owns `T`. Other tasks send command messages over an `mpsc` channel with a `oneshot::Sender` for the reply.',
        },
      ],
      executionSteps: [
        '1. `tokio::spawn(async move { ... })` packs future into an allocated Task header.',
        '2. Task is pushed to the worker thread local ring buffer.',
        '3. Worker thread pops Task and invokes `Future::poll(cx)`.',
        '4. Future reads TCP stream; no bytes ready -> socket registers interest with OS epoll.',
        '5. Future returns `Poll::Pending`; worker thread switches to next available task.',
        '6. Kernel signals socket readable; Tokio Reactor triggers `Waker::wake()`.',
        '7. Task is rescheduled onto an executor queue to resume from the exact suspension point.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `tokio_actor_system/
├── Cargo.toml
├── src/
│   ├── main.rs            # tokio::main runtime bootstrap, shutdown listener
│   ├── actor/             # Dedicated state-owning actors
│   │   ├── mod.rs
│   │   ├── messages.rs    # Command enums with oneshot reply channels
│   │   └── state_actor.rs # The loop receiving commands and modifying state
│   ├── client.rs          # Ergonomic handle wrapping mpsc::Sender
│   └── workers/           # Background polling, cron, and event listener tasks
│       ├── mod.rs
│       └── reporter.rs`,
      architecturalPhilosophy:
        'Never call blocking synchronous code (e.g. `std::thread::sleep`, `std::fs::read`, synchronous HTTP requests) inside an async function! Doing so freezes an entire Tokio worker thread. Use `tokio::task::spawn_blocking` for CPU-heavy or synchronous operations.',
      patterns: [
        {
          name: 'The Actor Pattern with mpsc and oneshot',
          whyUseIt:
            'Guarantees 100% thread safety and avoids deadlocks. State is owned by exactly one task; everyone else sends requests.',
          codeExample: `use std::sync::mpsc;

pub enum CacheCommand {
    Get { key: String, reply: tokio::sync::oneshot::Sender<Option<String>> },
    Set { key: String, val: String, reply: tokio::sync::oneshot::Sender<()> },
}

// Actor loop owns the HashMap exclusively
pub async fn run_cache_actor(mut rx: tokio::sync::mpsc::Receiver<CacheCommand>) {
    let mut store = std::collections::HashMap::new();
    while let Some(cmd) = rx.recv().await {
        match cmd {
            CacheCommand::Get { key, reply } => {
                let _ = reply.send(store.get(&key).cloned());
            }
            CacheCommand::Set { key, val, reply } => {
                store.insert(key, val);
                let _ = reply.send(());
            }
        }
    }
}`,
        },
      ],
      stateManagement:
        'Prefer Channels (Actors) for complex evolving state. Use `Arc<RwLock<T>>` for read-heavy, write-rare caches.',
      errorHandlingAdvice:
        'Always handle channel disconnection errors gracefully. If a receiver drops, `.send()` returns an error rather than panicking.',
      testingAdvice:
        'Use `#[tokio::test(flavor = "current_thread")]` for predictable single-threaded async tests, and `tokio::time::pause()` to fast-forward time in tests instantly.',
    },
    productionSnippets: [
      {
        title: 'Graceful Shutdown with CancellationToken & select!',
        purpose: 'Ensures servers finish active in-flight requests before exiting on SIGINT / Ctrl+C.',
        code: `pub enum ShutdownSignal {
    Received,
}

pub fn simulate_graceful_shutdown() -> &'static str {
    "Worker loop exited cleanly upon receiving shutdown token."
}

fn main() {
    println!("{}", simulate_graceful_shutdown());
}`,
      },
    ],
    challenge: {
      id: 'ch-async-channel-broker',
      title: 'Challenge: Build an In-Memory Message Bus with Worker Pools',
      description: 'Implement a message dispatch queue with round-robin worker distribution.',
      requirements: [
        'Complete `dispatch_tasks(tasks: Vec<String>, worker_count: usize) -> Vec<Vec<String>>` to evenly partition jobs across workers',
        'Handle edge cases where worker_count is 0 or tasks is empty',
      ],
      starterCode: `// Challenge: Message Bus Task Partitioning
// In async systems, incoming traffic is distributed across worker pools.

pub fn dispatch_tasks(tasks: Vec<String>, worker_count: usize) -> Vec<Vec<String>> {
    // Distribute tasks across worker_count queues in round-robin fashion.
    // If worker_count is 0, return an empty Vec.
    // Example: 4 tasks across 2 workers -> [[task0, task2], [task1, task3]]
    Vec::new()
}

fn main() {
    let tasks = vec!["fetch_user".into(), "send_email".into(), "backup_db".into()];
    let queues = dispatch_tasks(tasks, 2);
    println!("Distributed across 2 workers: {:?}", queues);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empty_workers() {
        assert_eq!(dispatch_tasks(vec!["job1".into()], 0), Vec::<Vec<String>>::new());
    }

    #[test]
    fn test_round_robin_distribution() {
        let tasks = vec!["a".into(), "b".into(), "c".into(), "d".into(), "e".into()];
        let distributed = dispatch_tasks(tasks, 3);
        assert_eq!(distributed.len(), 3);
        assert_eq!(distributed[0], vec!["a", "d"]);
        assert_eq!(distributed[1], vec!["b", "e"]);
        assert_eq!(distributed[2], vec!["c"]);
    }
}
`,
      solutionCode: `pub fn dispatch_tasks(tasks: Vec<String>, worker_count: usize) -> Vec<Vec<String>> {
    if worker_count == 0 {
        return Vec::new();
    }
    let mut queues: Vec<Vec<String>> = (0..worker_count).map(|_| Vec::new()).collect();
    for (i, task) in tasks.into_iter().enumerate() {
        queues[i % worker_count].push(task);
    }
    queues
}
`,
      hints: [
        {
          level: 1,
          title: 'Initialize vector of vectors',
          content: 'Use `(0..worker_count).map(|_| Vec::new()).collect()` to create empty worker buckets.',
        },
        {
          level: 2,
          title: 'Modulo indexing',
          content: 'Push task `i` into `queues[i % worker_count]`.',
        },
      ],
      verificationCriteria: 'All round-robin task partition tests pass.',
    },
  },

  // ==========================================
  // 3. BEVY & HIGH PERFORMANCE GAME ENGINES
  // ==========================================
  {
    id: 'bevy',
    name: 'Bevy Game Engine (ECS)',
    category: 'Game Engines & Simulation',
    badge: 'Next-Gen Data-Driven Engine',
    crates: ['bevy = "0.14"'],
    tagline: 'Simple, data-driven game engine built around the Entity Component System (ECS) architecture.',
    summary:
      'Bevy is revolutionizing systems programming by replacing deep object-oriented inheritance trees (`class Monster extends Actor extends GameObject`) with pure, data-oriented Entity Component Systems. This layout maximizes CPU L1/L2 cache locality and enables the engine to parallelize your game loops across all CPU cores automatically.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                                BEVY ECS ARCHITECTURE                            |
|                                                                                 |
|   ENTITIES (IDs only)          COMPONENTS (Pure Data)                           |
|   Entity #1 (Player)   ----->  [Position { x: 10, y: 20 }]                      |
|                        ----->  [Velocity { dx: 1, dy: 0 }]                      |
|                        ----->  [Health { current: 100 }]                        |
|                                                                                 |
|   Entity #2 (Bullet)   ----->  [Position { x: 50, y: 20 }]                      |
|                        ----->  [Velocity { dx: 15, dy: 0 }]                     |
|                                                                                 |
|                                ARCHETYPE STORAGE                                |
|   Memory Table: [Entities with Position + Velocity]                             |
|   -----------------------------------------------------------------------       |
|   Row 1: Position #1 | Velocity #1   (Contiguous in RAM! 0 cache misses)        |
|   Row 2: Position #2 | Velocity #2                                              |
|                                                                                 |
|                                SYSTEMS (Pure Logic)                             |
|   fn movement_system(mut query: Query<(&mut Position, &Velocity)>)              |
|   * Iterates through contiguous RAM at hardware SIMD speed                      |
|   * Automatically runs in PARALLEL with systems that don't write to Position!   |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Think of an ECS as an in-memory SQL relational database for your game: Entities are simply integer Row IDs (`ID: 42`). Components are Columns of data (e.g. `Position`, `Health`). Systems are SQL queries like `UPDATE Table SET Position.x = Position.x + Velocity.dx WHERE has(Position) AND has(Velocity)`. The engine guarantees maximum hardware cache speeds because matching components sit next to each other in memory.',
      coreConcepts: [
        {
          concept: 'Entities are IDs, Not Objects',
          plainEnglish: 'An Entity contains zero methods and zero data—it is literally just an integer ID.',
          underTheHood:
            'In Bevy, an `Entity` is a 64-bit identifier (32-bit index + 32-bit generation). Storing entities as pure IDs prevents the "dangling pointer" bugs common in C++ game engines.',
        },
        {
          concept: 'Archetype-Based Storage',
          plainEnglish: 'Game items with identical components are packed together in memory like eggs in a carton.',
          underTheHood:
            'Bevy groups entities with matching component sets into "Archetypes". When a system queries entities, the CPU streams memory straight from RAM into L1 cache without pointer chasing.',
        },
        {
          concept: 'Automatic System Parallelization',
          plainEnglish: 'Your game logic automatically uses all CPU cores without writing thread code.',
          underTheHood:
            'Bevy analyzes system function signatures at compile time: if System A queries `&mut Health` and System B queries `&mut Transform`, Bevy detects zero memory conflict and schedules both to run concurrently on separate threads.',
        },
      ],
      executionSteps: [
        '1. App is configured with Plugins and Schedules (Startup, Update, FixedUpdate).',
        '2. Frame starts: Input events (Keyboard, Mouse, Gamepad) are gathered.',
        '3. Bevy schedules Systems by building a directed acyclic graph (DAG) of read/write accesses.',
        '4. Systems execute in parallel across a thread pool.',
        '5. Queries stream through contiguous Archetype tables.',
        '6. Frame renders GPU draw commands via modern wgpu pipeline.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `space_invaders_bevy/
├── Cargo.toml
├── assets/
│   ├── sprites/
│   └── audio/
├── src/
│   ├── main.rs            # App bootstrap, window configuration, plugin loading
│   ├── state.rs           # GameState enum (Menu, Playing, GameOver, Paused)
│   ├── components/        # Pure data structs with #[derive(Component)]
│   │   ├── mod.rs
│   │   ├── player.rs
│   │   ├── enemy.rs
│   │   └── physics.rs     # Transform, Velocity, Collider
│   ├── resources/         # Global singletons (Score, AssetHandles, GameConfig)
│   │   ├── mod.rs
│   │   └── game_stats.rs
│   ├── events/            # Inter-system messaging (GameOverEvent, BulletHitEvent)
│   │   └── mod.rs
│   └── systems/           # Pure functions with Query<...>
│       ├── mod.rs
│       ├── input.rs
│       ├── movement.rs
│       └── collision.rs`,
      architecturalPhilosophy:
        'Never store game logic inside component structs. Keep components as dumb data holders (`struct Health(f32)`). Put all algorithms inside systems. Group related systems, components, and events into modular `Plugin` structs.',
      patterns: [
        {
          name: 'The Plugin Architecture Pattern',
          whyUseIt:
            'Divides a massive 50,000-line game into self-contained, reusable modules (e.g. `PlayerPlugin`, `AudioPlugin`, `CombatPlugin`).',
          codeExample: `// Bevy Plugin pattern
pub struct CombatPlugin;

impl CombatPlugin {
    pub fn register() -> &'static str {
        "CombatPlugin registered with CollisionSystem and DamageSystem"
    }
}`,
        },
      ],
      stateManagement:
        'Use `Resource` for global singletons (Score, HighScore, Database connection). Use `Component` for data that belongs to specific entities.',
      errorHandlingAdvice:
        'Game loops must not crash. Instead of panicking, use `if let Ok(...) = query.get_single()` or emit diagnostic warning logs.',
      testingAdvice:
        'Because Bevy systems are pure functions taking `Query` and `Res`, you can test complete game mechanics headlessly in unit tests without opening a graphics window!',
    },
    productionSnippets: [
      {
        title: 'Complete ECS Physics Simulation Loop',
        purpose: 'Demonstrates component declaration, entity creation, and system query loops.',
        code: `#[derive(Debug, Clone, Copy)]
pub struct Position { pub x: f32, pub y: f32 }

#[derive(Debug, Clone, Copy)]
pub struct Velocity { pub dx: f32, pub dy: f32 }

pub struct World {
    pub positions: Vec<Position>,
    pub velocities: Vec<Velocity>,
}

impl World {
    pub fn tick_physics(&mut self, dt: f32) {
        for (pos, vel) in self.positions.iter_mut().zip(self.velocities.iter()) {
            pos.x += vel.dx * dt;
            pos.y += vel.dy * dt;
        }
    }
}

fn main() {
    let mut world = World {
        positions: vec![Position { x: 0.0, y: 0.0 }],
        velocities: vec![Velocity { dx: 10.0, dy: 5.0 }],
    };
    world.tick_physics(1.0);
    println!("Entity 0 moved to: {:?}", world.positions[0]);
}`,
      },
    ],
    challenge: {
      id: 'ch-ecs-collision',
      title: 'Challenge: Implement an Axis-Aligned Bounding Box (AABB) System',
      description: 'Implement a 2D collision detection system calculating overlaps between game entities.',
      requirements: [
        'Complete `check_collision(box1: (f32, f32, f32, f32), box2: (f32, f32, f32, f32)) -> bool` where box is (x, y, width, height)',
        'Return true if and only if the two boxes overlap in both axes',
      ],
      starterCode: `// Challenge: 2D AABB Collision Detection System
// In 2D game engines, AABB collision is the primary broad-phase check.

pub fn check_collision(
    box1: (f32, f32, f32, f32),
    box2: (f32, f32, f32, f32)
) -> bool {
    // box format: (x, y, width, height) where x,y is top-left corner
    // Two boxes collide if:
    // - box1.x < box2.x + box2.width AND box1.x + box1.width > box2.x
    // - box1.y < box2.y + box2.height AND box1.y + box1.height > box2.y
    false
}

fn main() {
    let player = (10.0, 10.0, 32.0, 32.0);
    let bullet = (20.0, 20.0, 8.0, 8.0);
    println!("Colliding? {}", check_collision(player, bullet));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_overlapping() {
        assert!(check_collision((0.0, 0.0, 10.0, 10.0), (5.0, 5.0, 10.0, 10.0)));
    }

    #[test]
    fn test_disjoint() {
        assert!(!check_collision((0.0, 0.0, 10.0, 10.0), (20.0, 20.0, 10.0, 10.0)));
    }
}
`,
      solutionCode: `pub fn check_collision(
    box1: (f32, f32, f32, f32),
    box2: (f32, f32, f32, f32)
) -> bool {
    let (x1, y1, w1, h1) = box1;
    let (x2, y2, w2, h2) = box2;

    x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2
}
`,
      hints: [
        {
          level: 1,
          title: 'Unpack tuple variables',
          content: 'Unpack `let (x1, y1, w1, h1) = box1;` and `let (x2, y2, w2, h2) = box2;`.',
        },
        {
          level: 2,
          title: 'Axis condition',
          content: 'Return `x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2`.',
        },
      ],
      verificationCriteria: 'All AABB collision geometry assertions pass.',
    },
  },

  // ==========================================
  // 4. CLAP & RATATUI (CLI & Terminal Interfaces)
  // ==========================================
  {
    id: 'ratatui',
    name: 'Clap & Ratatui (CLI & TUI)',
    category: 'CLI & Terminal',
    badge: 'Terminal Mastery',
    crates: ['clap = { version = "4.4", features = ["derive"] }', 'ratatui = "0.27"', 'crossterm = "0.27"'],
    tagline: 'Build blazingly fast CLI argument parsers and rich interactive terminal user interfaces.',
    summary:
      'Rust has become the preferred language for modern systems CLI tools (like ripgrep, bat, and exa/eza). Clap allows declarative command-line argument parsing with zero boilerplate via derive macros, while Ratatui enables building full terminal dashboards with tabs, charts, lists, and forms.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                       RATATUI DOUBLE-BUFFERING PIPELINE                         |
|                                                                                 |
|   1. Event Polling (Crossterm in Raw Mode):                                     |
|      Captures KeyEvents (Press 'q', Up/Down arrow) without waiting for Enter!   |
|                                                                                 |
|   2. Immediate-Mode Layout Draw Pass:                                           |
|      terminal.draw(|frame| {                                                    |
|          let chunks = Layout::default().split(frame.size());                    |
|          frame.render_widget(Gauge::new().percent(cpu), chunks[0]);             |
|          frame.render_widget(List::new(tasks), chunks[1]);                      |
|      })                                                                         |
|                                                                                 |
|   3. Differential ANSI Terminal Flushing:                                       |
|      [Previous Frame Buffer]   vs   [Next Frame Buffer]                         |
|      Only cells that ACTUALLY CHANGED are sent over stdout!                     |
|      Result: Silky smooth 60 FPS terminal UI with ZERO flicker!                 |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Standard CLI apps print line-by-line scrolling text. Ratatui turns the terminal into a 2D canvas of character cells (columns and rows). In raw mode, it suppresses normal terminal echo, draws full-screen layouts in an in-memory buffer, and computes the exact diff to minimize bytes sent to stdout.',
      coreConcepts: [
        {
          concept: 'Clap Derive Macros',
          plainEnglish: 'Declare your flags and options as a normal Rust struct.',
          underTheHood:
            'Clap inspects doc comments to generate `--help` messages automatically and enforces type conversions (e.g. converting a string port to `u16`) at compile time.',
        },
        {
          concept: 'Double Buffering',
          plainEnglish: 'Never redraw the whole screen—only touch changed characters.',
          underTheHood:
            'Ratatui keeps two in-memory matrices of `Cell { symbol, fg, bg, modifier }`. It computes the diff between frames and emits minimal ANSI cursor escape sequences (e.g. `\\x1B[10;15H`).',
        },
      ],
      executionSteps: [
        '1. Clap parses `std::env::args()` into typed CLI config struct.',
        '2. Terminal switches into Raw Mode and enters Alternate Screen buffer.',
        '3. Application loop polls for keyboard/mouse events with timeout.',
        '4. On event or tick: mutate state model and call `terminal.draw(...)`.',
        '5. On exit or panic: ALWAYS restore normal terminal mode and leave Alternate Screen.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `ferris_sysmon/
├── Cargo.toml
├── src/
│   ├── main.rs            # Clap CLI parsing, terminal setup/cleanup hooks
│   ├── app.rs             # Application state machine, tabs, active list index
│   ├── events.rs          # Event polling thread (Crossterm event channel)
│   ├── ui/                # UI rendering widgets
│   │   ├── mod.rs
│   │   ├── header.rs
│   │   ├── cpu_chart.rs
│   │   └── process_list.rs
│   └── metrics/           # System telemetry collector (sysinfo crate)
│       └── mod.rs`,
      architecturalPhilosophy:
        'Always implement a Panic Hook or RAII Drop guard for your terminal. If your program panics while in Raw Mode without restoring normal mode, the user’s shell prompt will become scrambled and unreadable.',
      patterns: [
        {
          name: 'Terminal RAII Cleanup Guard',
          whyUseIt:
            'Guarantees terminal is restored even if a panic or early return occurs.',
          codeExample: `pub struct TerminalGuard;

impl Drop for TerminalGuard {
    fn drop(&mut self) {
        // Restores terminal cursor and exits alternate screen
        println!("Terminal restored to normal cooked mode.");
    }
}`,
        },
      ],
      stateManagement:
        'Store all TUI state in a centralized `App` struct. Pass `&mut app` to event handlers and `&app` to render widgets.',
      errorHandlingAdvice:
        'Capture errors in a status bar notification inside the UI rather than panicking out to the shell.',
      testingAdvice:
        'Use Ratatui’s `TestBackend` to render frames into an in-memory test buffer and assert on rendered strings without an actual terminal window.',
    },
    productionSnippets: [
      {
        title: 'TUI State Machine & Menu Navigator',
        purpose: 'Demonstrates selection indexing, boundary checks, and circular cycling.',
        code: `pub struct MenuState {
    pub items: Vec<&'static str>,
    pub selected: usize,
}

impl MenuState {
    pub fn new(items: Vec<&'static str>) -> Self {
        Self { items, selected: 0 }
    }

    pub fn next(&mut self) {
        if !self.items.is_empty() {
            self.selected = (self.selected + 1) % self.items.len();
        }
    }

    pub fn previous(&mut self) {
        if !self.items.is_empty() {
            if self.selected == 0 {
                self.selected = self.items.len() - 1;
            } else {
                self.selected -= 1;
            }
        }
    }
}

fn main() {
    let mut menu = MenuState::new(vec!["Dashboard", "Logs", "Settings"]);
    menu.next();
    println!("Selected tab: {}", menu.items[menu.selected]);
}`,
      },
    ],
    challenge: {
      id: 'ch-tui-progress',
      title: 'Challenge: Build an ASCII Progress Bar & Percentage Formatter',
      description: 'Implement a terminal progress bar generator with width clamping and percentage labels.',
      requirements: [
        'Complete `format_progress_bar(progress: f32, width: usize) -> String` where progress is 0.0 to 1.0',
        'Output format: `[====    ] 50%` with exact character width',
      ],
      starterCode: `// Challenge: Terminal Progress Bar Generator
// In TUI dashboards, widgets format live metrics into fixed-width bars.

pub fn format_progress_bar(progress: f32, width: usize) -> String {
    // progress is clamped between 0.0 and 1.0.
    // width is the number of bar characters inside the brackets.
    // filled chars use '=' and empty chars use ' '.
    // Suffix with space and rounded percentage like " 75%".
    // Example: progress = 0.5, width = 10 -> "[=====     ] 50%"
    String::new()
}

fn main() {
    println!("{}", format_progress_bar(0.65, 20));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_zero() {
        assert_eq!(format_progress_bar(0.0, 5), "[     ] 0%");
    }

    #[test]
    fn test_half() {
        assert_eq!(format_progress_bar(0.5, 4), "[==  ] 50%");
    }

    #[test]
    fn test_full() {
        assert_eq!(format_progress_bar(1.0, 4), "[====] 100%");
    }
}
`,
      solutionCode: `pub fn format_progress_bar(progress: f32, width: usize) -> String {
    let p = progress.clamp(0.0, 1.0);
    let filled_count = (p * width as f32).round() as usize;
    let empty_count = width.saturating_sub(filled_count);
    let percent = (p * 100.0).round() as u32;

    let bar: String = "=".repeat(filled_count) + &" ".repeat(empty_count);
    format!("[{}] {}%", bar, percent)
}
`,
      hints: [
        {
          level: 1,
          title: 'Clamp progress',
          content: 'Use `let p = progress.clamp(0.0, 1.0);` to handle values < 0.0 or > 1.0.',
        },
        {
          level: 2,
          title: 'String repetition',
          content: 'Use `"=".repeat(filled_count)` and `" ".repeat(empty_count)`.',
        },
      ],
      verificationCriteria: 'All progress bar bracket layouts and percentages pass.',
    },
  },

  // ==========================================
  // 5. TAURI V2 (Desktop & Mobile Cross-Platform GUI)
  // Reference: https://v2.tauri.app/concept/
  // ==========================================
  {
    id: 'tauri-v2',
    name: 'Tauri v2 (Desktop & Mobile)',
    category: 'Desktop & GUI',
    badge: 'Cross-Platform Native Runtime',
    crates: ['tauri = "2.0"', 'serde = { version = "1.0", features = ["derive"] }', 'serde_json = "1.0"'],
    tagline: 'Build blazingly fast, lightweight, and memory-safe desktop & mobile applications with Rust.',
    summary:
      'Tauri v2 (v2.tauri.app/concept) revolutionizes native app development. Instead of bundling a 200MB Chromium browser per app (like Electron), Tauri leverages the operating system’s built-in webview (WebKit on macOS/iOS, WebView2 on Windows, WebKitGTK on Linux) and executes all core business logic, filesystem, hardware, and networking inside a hardened, sandboxed Rust Core Process.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                           TAURI v2 ARCHITECTURE DUAL-PROCESS                    |
|                                                                                 |
|   WEBVIEW PROCESS (UI Presentation)             CORE PROCESS (Rust Native)      |
|   HTML5 / CSS / React / Svelte / WASM          Sandboxed Business Logic Engine  |
|                                                                                 |
|   [User clicks "Encrypt File"]                                                  |
|              |                                                                  |
|              v                                                                  |
|   window.__TAURI_INTERNALS__.invoke(          +-------------------------------+ |
|       'encrypt_file',                         | TAURI IPC DISPATCHER          | |
|       { path: "/docs/secret.txt" }            | Validates IPC Permissions &   | |
|   )                                           | Security Capability Scopes    | |
|              |                                +-------------------------------+ |
|              | === JSON RPC Message Pipe ===>                 |                 |
|                                                               v                 |
|                                               #[tauri::command]                 |
|                                               fn encrypt_file(                  |
|                                                   path: String,                 |
|                                                   state: State<AppKey>          |
|                                               ) -> Result<String, Error>        |
|                                                               |                 |
|   [Render Success Toast] <=== Result JSON ====================+                 |
|                                                                                 |
|   * ZERO Chromium bundle (App size ~3MB instead of 150MB!)                      |
|   * Rust handles file I/O, cryptography, and OS hardware with zero-cost safety  |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Think of Tauri as an embassy: The WebView is the ambassador greeting the public in the front lobby (rendering UI buttons and text). When the ambassador needs to open a vault or sign an official treaty (accessing the filesystem, camera, or database), they must pass a sealed message through a secure window (the IPC Bridge) to the armed security team inside the vault (the Rust Core Process). The Rust team checks your security badges (Tauri Capabilities) before executing the request.',
      coreConcepts: [
        {
          concept: 'Core Process vs WebView Process',
          plainEnglish: 'Separation of presentation (visual UI) from raw operating system powers.',
          underTheHood:
            'Tauri separates the application into two OS processes. The WebView process handles DOM rendering and user events. The Core process is a native compiled Rust executable controlling system tray, window lifecycle, and OS permissions.',
        },
        {
          concept: 'Tauri v2 Capabilities & Security Scopes',
          plainEnglish: 'Fine-grained permissions: frontend cannot read arbitrary files unless explicitly permitted.',
          underTheHood:
            'Tauri v2 replaces monolithic permissions with modular JSON capability files. You configure exact allowlists (e.g. `fs:allow-read-text-file` scoped strictly to `$APPDATA/*`). Any frontend script injection or malicious npm package trying to read `/etc/passwd` is blocked by the IPC gate.',
        },
        {
          concept: 'IPC Command Serialization with Serde',
          plainEnglish: 'Calling a Rust backend function directly from JavaScript like a local async function.',
          underTheHood:
            'Commands marked with `#[tauri::command]` automatically generate serialization and deserialization code via Rust macros, converting JavaScript JSON arguments into typed Rust structs at native speed.',
        },
      ],
      executionSteps: [
        '1. Application launches: Rust Core initializes OS window and webview.',
        '2. Webview loads HTML/CSS/JS frontend bundled into memory.',
        '3. Frontend invokes `invoke("command_name", { args })`.',
        '4. Tauri IPC bridge verifies the active window has permission in its Capability file.',
        '5. Core process deserializes payload into typed Rust arguments.',
        '6. Command executes with access to `tauri::State` (shared databases or keys).',
        '7. Result is serialized to JSON and resolved as a JavaScript Promise.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `my_tauri_app/
├── src-tauri/             # Rust Native Core
│   ├── Cargo.toml
│   ├── tauri.conf.json    # Window config, bundle IDs, security settings
│   ├── capabilities/      # Tauri v2 security permission files
│   │   └── default.json
│   ├── src/
│   │   ├── main.rs        # App entry point, plugin registration, setup hooks
│   │   ├── commands/      # #[tauri::command] controllers
│   │   │   ├── mod.rs
│   │   │   ├── file_ops.rs
│   │   │   └── system.rs
│   │   ├── state.rs       # AppState wrapped in Mutex/RwLock
│   │   └── error.rs       # Custom SerializableError for clean JS rejection
└── src/                   # Frontend UI (React, Vite, or Svelte)
    ├── App.tsx
    └── package.json`,
      architecturalPhilosophy:
        'Never write heavy business logic in JavaScript. Use the frontend solely for visual rendering and state presentation. Place all file operations, cryptography, database caching, and network requests inside Rust commands. Always return `Result<T, CustomError>` where CustomError implements `serde::Serialize` so JavaScript receives meaningful error objects rather than stringified panics.',
      patterns: [
        {
          name: 'Typed Serializable Error Pattern',
          whyUseIt:
            'Ensures JavaScript frontend receives typed rejection objects in `catch (err)` with error codes.',
          codeExample: `#[derive(Debug, serde::Serialize)]
#[serde(tag = "type", content = "message")]
pub enum CommandError {
    FileNotFound(String),
    PermissionDenied(String),
}

#[tauri::command]
pub fn read_secure_file(path: String) -> Result<String, CommandError> {
    if !path.starts_with("/safe/") {
        return Err(CommandError::PermissionDenied("Path outside sandbox".into()));
    }
    Ok(format!("Contents of {}", path))
}`,
        },
      ],
      stateManagement:
        'Inject global singletons into commands using `app.manage(AppState::default())` in `main.rs` and access them in commands via `state: tauri::State<AppState>`.',
      errorHandlingAdvice:
        'Never unwrap in a `#[tauri::command]`. A panic crashes the native desktop window. Always bubble errors with `Result<T, CommandError>`.',
      testingAdvice:
        'Extract business logic into pure Rust helper functions separate from the `#[tauri::command]` wrapper so you can run `cargo test` in terminal CI without spawning a desktop window.',
    },
    productionSnippets: [
      {
        title: 'Tauri v2 IPC Command with Managed State & Validation',
        purpose: 'Demonstrates command declaration, state access, argument validation, and JSON serialization.',
        code: `use std::sync::Mutex;
use std::collections::HashMap;

#[derive(Default)]
pub struct AppCache {
    pub memory: Mutex<HashMap<String, String>>,
}

// Simulated Tauri command handler
pub fn invoke_cache_set(cache: &AppCache, key: String, value: String) -> Result<String, String> {
    if key.is_empty() {
        return Err("Key cannot be empty".into());
    }
    let mut map = cache.memory.lock().map_err(|_| "Lock poisoned")?;
    map.insert(key.clone(), value);
    Ok(format!("Successfully cached key: '{}'", key))
}

fn main() {
    let cache = AppCache::default();
    match invoke_cache_set(&cache, "auth_token".into(), "xyz987".into()) {
        Ok(msg) => println!("IPC Response: {}", msg),
        Err(e) => println!("IPC Error: {}", e),
    }
}`,
      },
    ],
    challenge: {
      id: 'ch-tauri-ipc-router',
      title: 'Challenge: Build a Typed Tauri v2 IPC Command Router',
      description: 'Implement a command dispatcher that routes frontend method calls to typed handlers with permission checks.',
      requirements: [
        'Complete `dispatch_command(cmd_name: &str, payload: &str, is_authorized: bool) -> Result<String, &\'static str>`',
        'If `is_authorized` is false, reject with `Err("UNAUTHORIZED")`',
        'Support "ping" -> Ok("pong"), "echo" -> Ok(payload.to_uppercase()), anything else -> Err("COMMAND_NOT_FOUND")',
      ],
      starterCode: `// Challenge: Tauri v2 IPC Command Dispatcher & Capability Gate
// Dispatches incoming string IPC commands from the WebView to native handlers.

pub fn dispatch_command(cmd_name: &str, payload: &str, is_authorized: bool) -> Result<String, &'static str> {
    // 1. If not authorized, return Err("UNAUTHORIZED")
    // 2. If cmd_name is "ping", return Ok("pong".to_string())
    // 3. If cmd_name is "echo", return Ok(payload.to_uppercase())
    // 4. Otherwise, return Err("COMMAND_NOT_FOUND")
    Err("Not implemented")
}

fn main() {
    println!("{:?}", dispatch_command("ping", "", true));
    println!("{:?}", dispatch_command("echo", "hello world", true));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_unauthorized() {
        assert_eq!(dispatch_command("ping", "", false), Err("UNAUTHORIZED"));
    }

    #[test]
    fn test_valid_commands() {
        assert_eq!(dispatch_command("ping", "", true), Ok("pong".into()));
        assert_eq!(dispatch_command("echo", "tauri v2", true), Ok("TAURI V2".into()));
        assert_eq!(dispatch_command("delete_disk", "", true), Err("COMMAND_NOT_FOUND"));
    }
}
`,
      solutionCode: `pub fn dispatch_command(cmd_name: &str, payload: &str, is_authorized: bool) -> Result<String, &'static str> {
    if !is_authorized {
        return Err("UNAUTHORIZED");
    }

    match cmd_name {
        "ping" => Ok("pong".to_string()),
        "echo" => Ok(payload.to_uppercase()),
        _ => Err("COMMAND_NOT_FOUND"),
    }
}
`,
      hints: [
        {
          level: 1,
          title: 'Permission check first',
          content: 'Check `if !is_authorized { return Err("UNAUTHORIZED"); }` at the very start.',
        },
        {
          level: 2,
          title: 'Pattern match on command',
          content: 'Match `cmd_name` against `"ping"`, `"echo"`, and `_`.',
        },
      ],
      verificationCriteria: 'All Tauri IPC command dispatch and authorization gate tests pass.',
    },
  },

  // ==========================================
  // 6. GOOGLE CLOUD WITH RUST (Cloud-Native Enterprise Systems)
  // Reference: https://docs.cloud.google.com/rust/docs/overview
  // ==========================================
  {
    id: 'google-cloud-rust',
    name: 'Google Cloud Platform (GCP) with Rust',
    category: 'Cloud & Enterprise',
    badge: 'Enterprise Cloud Systems',
    crates: [
      'google-cloud-storage = "0.2"',
      'google-cloud-pubsub = "0.2"',
      'tonic = "0.12"',
      'tracing = "0.1"',
      'tracing-subscriber = { version = "0.3", features = ["json"] }',
    ],
    tagline: 'Architect mission-critical, low-latency microservices on Google Cloud Run, GKE, and Compute Engine.',
    summary:
      'Rust is the premier choice for ultra-low latency, memory-efficient cloud systems on Google Cloud (docs.cloud.google.com/rust/docs/overview). With zero garbage collection pauses and tiny binary footprints (~15MB containers), Rust microservices on Google Cloud Run start in milliseconds, withstand massive traffic spikes with near-zero RAM usage, and interact securely with Google Cloud Storage, Pub/Sub, and BigQuery via official gRPC/REST SDKs.',
    howItWorksUnderTheHood: {
      diagram: `+---------------------------------------------------------------------------------+
|                       GOOGLE CLOUD RUN & RUST MICROSERVICE                      |
|                                                                                 |
|   INCOMING INTERNET TRAFFIC                                                     |
|   HTTPS -> Google Cloud Global Load Balancer -> Google Cloud Run Ingress        |
|                                         |                                       |
|                                         v (Injects X-Cloud-Trace-Context header)|
|   +-----------------------------------------------------------------------+     |
|   | YOUR RUST CONTAINER (Alpine/Distroless ~15MB)                         |     |
|   | Listens on 0.0.0.0:$PORT (configured via std::env::var("PORT"))       |     |
|   |                                                                       |     |
|   | 1. IAM Workload Authentication:                                       |     |
|   |    Queries GCP Metadata Server (http://metadata.google.internal)      |     |
|   |    -> Automatically obtains temporary OAuth2 Bearer Access Token      |     |
|   |                                                                       |     |
|   | 2. High-Throughput Event Streaming:                                  |     |
|   |    gRPC Connection Pool (Tonic / HTTP/2)                              |     |
|   |    -> Google Cloud Pub/Sub: Batch Publishes 10,000 events/sec         |     |
|   |    -> Google Cloud Storage: Streams large files with zero copy        |     |
|   |                                                                       |     |
|   | 3. Structured Cloud Logging:                                          |     |
|   |    tracing emits JSON to stdout:                                      |     |
|   |    { "severity": "INFO", "message": "Done", "logging.googleapis.com" }|     |
|   +-----------------------------------------------------------------------+     |
|                                         |                                       |
|   GCP Observability Engine: Cloud Logging & Cloud Trace automatically           |
|   correlates logs across your entire distributed microservice mesh!             |
+---------------------------------------------------------------------------------+`,
      mentalModel:
        'Think of Google Cloud Run as an ultra-modern cargo seaport: Container ships (incoming HTTP requests) arrive at the docks. Cloud Run spins up your tiny Rust container in 100 milliseconds because there is no virtual machine or heavy interpreter to boot. Your container talks to the port authority office (GCP Metadata Server) to get its security clearance badge (IAM Token), communicates with warehouse cranes over high-speed optical fiber (gRPC to Pub/Sub and Storage), and automatically logs every shipment in structured black-box records (JSON stdout).',
      coreConcepts: [
        {
          concept: 'Automatic IAM Token Source (Metadata Server)',
          plainEnglish: 'Never hardcode API keys or service account JSON files in production code.',
          underTheHood:
            'When running inside Cloud Run or GKE, the official Google Cloud Rust SDK fetches short-lived OAuth2 tokens from `http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token` with header `Metadata-Flavor: Google`. Tokens are cached and refreshed before expiry.',
        },
        {
          concept: 'GCP Structured JSON Logging with tracing',
          plainEnglish: 'Make your logs instantly searchable and filterable in Google Cloud Console.',
          underTheHood:
            'Instead of plain text `println!`, use `tracing` with JSON formatting. Google Cloud Logging automatically parses top-level fields like `"severity"` (`"INFO"`, `"WARNING"`, `"ERROR"`), `"message"`, and `"logging.googleapis.com/trace"` to trace requests across microservices.',
        },
        {
          concept: 'Cloud Run Container Contract (PORT & SIGTERM)',
          plainEnglish: 'How Google Cloud orchestrates, scales, and stops your application cleanly.',
          underTheHood:
            'Cloud Run injects the `PORT` environment variable (typically 8080). Your app must bind to `0.0.0.0:$PORT`. When Cloud Run scales down or rolls out a new revision, it sends a `SIGTERM` signal; your Rust app catches this signal and finishes active in-flight requests before exiting.',
        },
      ],
      executionSteps: [
        '1. Rust service starts, reads `PORT` env var (defaulting to 8080), and binds TCP listener.',
        '2. Google Cloud client libraries initialize connection pools (gRPC channels with Tonic).',
        '3. Request arrives with `X-Cloud-Trace-Context` header.',
        '4. Service processes request, publishing events to Google Cloud Pub/Sub.',
        '5. Tracing logs record execution latency with severity level to stdout.',
        '6. On container shutdown: SIGTERM is caught, gracefully flushing buffers before exit.',
      ],
    },
    projectDesignGuide: {
      recommendedLayout: `gcp_rust_service/
├── Dockerfile             # Multi-stage distroless build (~15MB final image)
├── Cargo.toml
├── src/
│   ├── main.rs            # Bind 0.0.0.0:$PORT, SIGTERM trap, router init
│   ├── config.rs          # Project ID, PubSub topic, GCP region configs
│   ├── telemetry.rs       # Tracing subscriber with GCP JSON formatting
│   ├── gcp/               # Google Cloud SDK clients
│   │   ├── mod.rs
│   │   ├── pubsub.rs      # Event publisher & subscriber loops
│   │   └── storage.rs     # Cloud Storage object streaming
│   ├── handlers/          # HTTP & gRPC controllers
│   │   ├── mod.rs
│   │   └── health.rs      # /healthz and /readyz probes
│   └── errors.rs          # AppError with GCP error code translation`,
      architecturalPhilosophy:
        'Always design for Stateless Ephemerality. Cloud Run instances scale down to zero when idle and scale up to thousands of instances during surges. Keep local memory transient and persist all durable state to Google Cloud Storage, Cloud Pub/Sub, Firestore, or Cloud SQL.',
      patterns: [
        {
          name: 'Cloud Run PORT Resolution with Fallback',
          whyUseIt:
            'Ensures code runs seamlessly both locally (`localhost:3000`) and in Google Cloud Run (`0.0.0.0:$PORT`).',
          codeExample: `pub fn resolve_server_address() -> String {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    format!("0.0.0.0:{}", port)
}`,
        },
      ],
      stateManagement:
        'Stateless container model: Share client pools (`Arc<google_cloud_pubsub::client::Client>`) across request handlers with cheap cloning.',
      errorHandlingAdvice:
        'In Pub/Sub message consumption, if processing fails due to transient network issues, return `NACK` (negative acknowledgment) so Google Cloud Pub/Sub re-delivers the message after a backoff.',
      testingAdvice:
        'Use Google Cloud official local emulators (`gcloud beta emulators pubsub start`) to run full integration test suites locally without incurring cloud costs.',
    },
    productionSnippets: [
      {
        title: 'Google Cloud Run Server Bootstrap with Structured JSON Telemetry',
        purpose: 'Demonstrates PORT environment variable resolution, health probes, and GCP log formatting.',
        code: `pub struct GcpLogEntry {
    pub severity: &'static str,
    pub message: String,
    pub component: &'static str,
}

impl GcpLogEntry {
    pub fn to_json(&self) -> String {
        format!(
            "{{\"severity\":\"{}\",\"message\":\"{}\",\"component\":\"{}\"}}",
            self.severity, self.message, self.component
        )
    }
}

pub fn get_cloud_run_bind_addr() -> String {
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    format!("0.0.0.0:{}", port)
}

fn main() {
    let log = GcpLogEntry {
        severity: "INFO",
        message: "Google Cloud Run container initialized successfully".into(),
        component: "gcp_rust_service",
    };
    println!("{}", log.to_json());
    println!("Listening on: {}", get_cloud_run_bind_addr());
}`,
      },
    ],
    challenge: {
      id: 'ch-gcp-pubsub-consumer',
      title: 'Challenge: Build a Google Cloud Pub/Sub Message Acknowledgment Engine',
      description: 'Implement a message processor that validates payload integrity and determines ACK vs NACK.',
      requirements: [
        'Complete `process_pubsub_message(data_base64: &str, attempt_count: u32) -> Result<&\'static str, &\'static str>`',
        'If data_base64 is empty, return Err("DEAD_LETTER_EMPTY")',
        'If attempt_count > 5, return Err("EXCEEDED_MAX_RETRIES")',
        'Otherwise, return Ok("ACK")',
      ],
      starterCode: `// Challenge: Google Cloud Pub/Sub Message Processor & Retry Handler
// In Google Cloud architectures, subscribers ACK or NACK messages based on validation.

pub fn process_pubsub_message(data: &str, attempt_count: u32) -> Result<&'static str, &'static str> {
    // 1. If data is empty or whitespace-only, route to dead-letter queue: Err("DEAD_LETTER_EMPTY")
    // 2. If attempt_count > 5, message cannot be processed: Err("EXCEEDED_MAX_RETRIES")
    // 3. If valid, acknowledge receipt: Ok("ACK")
    Err("Not implemented")
}

fn main() {
    println!("{:?}", process_pubsub_message("valid_payload", 1));
    println!("{:?}", process_pubsub_message("", 1));
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_message() {
        assert_eq!(process_pubsub_message("event_order_created", 1), Ok("ACK"));
        assert_eq!(process_pubsub_message("event_user_signup", 4), Ok("ACK"));
    }

    #[test]
    fn test_empty_message() {
        assert_eq!(process_pubsub_message("", 1), Err("DEAD_LETTER_EMPTY"));
        assert_eq!(process_pubsub_message("   ", 2), Err("DEAD_LETTER_EMPTY"));
    }

    #[test]
    fn test_retry_limit() {
        assert_eq!(process_pubsub_message("event_data", 6), Err("EXCEEDED_MAX_RETRIES"));
    }
}
`,
      solutionCode: `pub fn process_pubsub_message(data: &str, attempt_count: u32) -> Result<&'static str, &'static str> {
    if data.trim().is_empty() {
        return Err("DEAD_LETTER_EMPTY");
    }

    if attempt_count > 5 {
        return Err("EXCEEDED_MAX_RETRIES");
    }

    Ok("ACK")
}
`,
      hints: [
        {
          level: 1,
          title: 'Trim check',
          content: 'Use `data.trim().is_empty()` to catch empty or whitespace payloads.',
        },
        {
          level: 2,
          title: 'Attempt count check',
          content: 'Check `if attempt_count > 5 { return Err("EXCEEDED_MAX_RETRIES"); }`.',
        },
      ],
      verificationCriteria: 'All Google Cloud Pub/Sub message processing and retry limits pass.',
    },
  },
];
