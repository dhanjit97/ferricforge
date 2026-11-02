import { CapstoneProject } from '../types/frameworks';

export const CAPSTONE_PROJECTS: CapstoneProject[] = [
  // ==========================================
  // PROJECT 1: MINI-REDIS IN-MEMORY CACHE
  // ==========================================
  {
    id: 'mini-redis',
    title: 'Mini-Redis: Distributed In-Memory Cache & Key-Value Store',
    category: 'Distributed Systems & Networking',
    difficulty: 'Advanced',
    estimatedHours: '12 - 16 hours',
    description:
      'Build a high-performance in-memory key-value database from scratch featuring a text command protocol, concurrent read/write locks, key expiration with TTL eviction, and thread-safe shared state.',
    realWorldImpact:
      'Powers modern web architecture by caching hot data, rate-limiting API traffic, and acting as a lightning-fast session broker across distributed microservices.',
    crates: ['tokio = "1.0"', 'serde = "1.0"', 'anyhow = "1.0"'],
    architectureDiagram: `+---------------------------------------------------------------------------------+
|                        MINI-REDIS ARCHITECTURAL OVERVIEW                        |
|                                                                                 |
|   CLIENT (TCP Sockets)                     MINI-REDIS CORE                      |
|                                                                                 |
|   [Client 1] ---- "SET score 100 EX 60" ---->  [TCP Listener]                  |
|   [Client 2] ---- "GET score" --------------->        |                         |
|                                                       v                         |
|                                            [Spawn Worker Task]                  |
|                                                       |                         |
|                                                       v                         |
|                                            [Command Protocol Parser]            |
|                                            (GET, SET, DEL, TTL, PING)           |
|                                                       |                         |
|                                                       v                         |
|                                   +---------------------------------------+     |
|                                   |  THREAD-SAFE IN-MEMORY CACHE STORE    |     |
|                                   |  Arc<RwLock<HashMap<String, Entry>>>  |     |
|                                   |  * Entry { value, expires_at }        |     |
|                                   +---------------------------------------+     |
|                                                       ^                         |
|                                                       |                         |
|                                            [Background TTL Cleaner]             |
|                                            (Evicts stale keys every 100ms)      |
+---------------------------------------------------------------------------------+`,
    moduleBreakdown: [
      {
        path: 'src/main.rs',
        role: 'Server entrypoint, socket loop, and CLI interface',
        keyTypes: 'ServerConfig, handle_client',
      },
      {
        path: 'src/store.rs',
        role: 'Thread-safe cache storage engine with TTL expiration',
        keyTypes: 'CacheStore, CacheEntry, SetOptions',
      },
      {
        path: 'src/protocol.rs',
        role: 'Parser converting raw text commands into strongly-typed enums',
        keyTypes: 'Command (Get, Set, Del, Ping, Ttl), Response',
      },
    ],
    milestones: [
      {
        step: 1,
        title: 'Define Command Protocol Enums & Parser',
        objective: 'Convert string inputs like "SET user:1 ferris EX 30" into a safe Rust enum.',
        keyTasks: [
          'Create `enum Command { Get(String), Set(String, String, Option<u64>), Del(String), Ping }`',
          'Implement string token splitting with whitespace handling',
          'Return structured `Result<Command, ProtocolError>` without panics',
        ],
        proTip: 'Use `.split_whitespace()` and `.next()` pattern matching to gracefully reject malformed arguments.',
      },
      {
        step: 2,
        title: 'Implement Thread-Safe Cache with RwLock',
        objective: 'Allow thousands of concurrent readers while synchronizing writes.',
        keyTasks: [
          'Store entries as `struct CacheEntry { value: String, expires_at: Option<u64> }`',
          'Wrap the storage in `std::sync::Arc<std::sync::RwLock<HashMap<String, CacheEntry>>>`',
          'Implement `.get()`, `.set()`, `.delete()`, and `.ttl()` methods',
        ],
        proTip: 'In `.get()`, check if `current_time > expires_at`. If expired, lazily delete the key and return None!',
      },
      {
        step: 3,
        title: 'Background Expiration Reaper Task',
        objective: 'Prevent memory leaks by actively sweeping expired keys.',
        keyTasks: [
          'Spawn a background loop that sleeps periodically',
          'Acquire write lock briefly to purge entries past their expiration timestamp',
        ],
        proTip: 'Avoid holding the write lock for long sweeps; evict keys in small batches of 50.',
      },
      {
        step: 4,
        title: 'Full Interactive Testing & Benchmarking',
        objective: 'Verify command responses and benchmark operations per second.',
        keyTasks: [
          'Test all commands with unit tests',
          'Simulate multi-threaded client operations',
        ],
        proTip: 'Run `cargo test` to ensure zero race conditions under concurrent access.',
      },
    ],
    pitfallsToAvoid: [
      {
        trap: 'Holding a std::sync::Mutex across an .await point in Tokio',
        explanation: 'Synchronous mutexes can deadlock worker threads when a task yields while holding the lock.',
        solution: 'Use `tokio::sync::RwLock` or keep critical sections short and synchronous without `.await` inside.',
      },
      {
        trap: 'Memory leak from keys that are never queried after expiring',
        explanation: 'Lazy expiration only removes keys when someone asks for them. Abandoned keys remain in memory forever.',
        solution: 'Always pair lazy checks with an active periodic background reaper thread.',
      },
    ],
    starterWorkspace: [
      {
        path: 'src/main.rs',
        name: 'main.rs',
        isEntry: true,
        content: `//! Mini-Redis Server
//! A concurrent in-memory cache with TTL expiration and command parsing.

mod store;
mod protocol;

use store::CacheStore;
use protocol::{Command, Response};

fn main() {
    println!("=== FerrisForge Mini-Redis Server Started ===");
    let store = CacheStore::new();

    // 1. SET key with 60 second TTL
    let set_cmd = Command::Set {
        key: "session:user_101".into(),
        val: "authenticated_token_xyz".into(),
        ttl_secs: Some(60),
    };
    let res = store.execute(set_cmd);
    println!("SET -> {:?}", res);

    // 2. GET key
    let get_cmd = Command::Get { key: "session:user_101".into() };
    let res = store.execute(get_cmd);
    println!("GET -> {:?}", res);

    // 3. TTL remaining
    let ttl_cmd = Command::Ttl { key: "session:user_101".into() };
    println!("TTL -> {:?}", store.execute(ttl_cmd));

    // 4. Test multi-command pipeline
    let test_keys = vec!["alpha", "beta", "gamma"];
    for k in test_keys {
        store.execute(Command::Set {
            key: k.into(),
            val: format!("val_{}", k),
            ttl_secs: None,
        });
    }

    println!("Total active cache keys: {}", store.len());
    println!("=== Mini-Redis Operating at 100% Health ===");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_store_lifecycle() {
        let store = CacheStore::new();
        store.execute(Command::Set {
            key: "greet".into(),
            val: "hello world".into(),
            ttl_secs: None,
        });

        let res = store.execute(Command::Get { key: "greet".into() });
        assert_eq!(res, Response::Value("hello world".into()));

        store.execute(Command::Del { key: "greet".into() });
        let after_del = store.execute(Command::Get { key: "greet".into() });
        assert_eq!(after_del, Response::Nil);
    }
}
`,
      },
      {
        path: 'src/store.rs',
        name: 'store.rs',
        content: `//! Thread-safe In-Memory Cache Store with TTL

use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::protocol::{Command, Response};

#[derive(Clone, Debug)]
pub struct CacheEntry {
    pub value: String,
    pub expires_at: Option<u64>, // Unix timestamp in seconds
}

#[derive(Clone)]
pub struct CacheStore {
    inner: Arc<RwLock<HashMap<String, CacheEntry>>>,
}

impl CacheStore {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    fn now_secs() -> u64 {
        SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs()
    }

    pub fn execute(&self, cmd: Command) -> Response {
        let now = Self::now_secs();

        match cmd {
            Command::Ping => Response::Pong,
            Command::Get { key } => {
                let mut map = self.inner.write().unwrap();
                if let Some(entry) = map.get(&key) {
                    if let Some(exp) = entry.expires_at {
                        if now >= exp {
                            // Expired: remove lazily
                            map.remove(&key);
                            return Response::Nil;
                        }
                    }
                    Response::Value(entry.value.clone())
                } else {
                    Response::Nil
                }
            }
            Command::Set { key, val, ttl_secs } => {
                let mut map = self.inner.write().unwrap();
                let expires_at = ttl_secs.map(|s| now + s);
                map.insert(key, CacheEntry { value: val, expires_at });
                Response::Ok
            }
            Command::Del { key } => {
                let mut map = self.inner.write().unwrap();
                if map.remove(&key).is_some() {
                    Response::Integer(1)
                } else {
                    Response::Integer(0)
                }
            }
            Command::Ttl { key } => {
                let map = self.inner.read().unwrap();
                if let Some(entry) = map.get(&key) {
                    match entry.expires_at {
                        None => Response::Integer(-1), // No expiration
                        Some(exp) => {
                            if exp > now {
                                Response::Integer((exp - now) as i64)
                            } else {
                                Response::Integer(-2) // Already expired
                            }
                        }
                    }
                } else {
                    Response::Integer(-2) // Not found
                }
            }
        }
    }

    pub fn len(&self) -> usize {
        self.inner.read().unwrap().len()
    }
}
`,
      },
      {
        path: 'src/protocol.rs',
        name: 'protocol.rs',
        content: `//! Command Protocol Definitions & Parser

#[derive(Debug, PartialEq, Eq)]
pub enum Command {
    Ping,
    Get { key: String },
    Set { key: String, val: String, ttl_secs: Option<u64> },
    Del { key: String },
    Ttl { key: String },
}

#[derive(Debug, PartialEq, Eq)]
pub enum Response {
    Ok,
    Pong,
    Nil,
    Value(String),
    Integer(i64),
    Error(String),
}

impl Command {
    pub fn parse(line: &str) -> Result<Self, String> {
        let mut tokens = line.split_whitespace();
        let verb = tokens.next().ok_or("Empty command")?.to_uppercase();

        match verb.as_str() {
            "PING" => Ok(Command::Ping),
            "GET" => {
                let key = tokens.next().ok_or("GET requires a key")?;
                Ok(Command::Get { key: key.to_string() })
            }
            "SET" => {
                let key = tokens.next().ok_or("SET requires a key")?;
                let val = tokens.next().ok_or("SET requires a value")?;
                let mut ttl = None;
                if let Some(opt) = tokens.next() {
                    if opt.to_uppercase() == "EX" {
                        if let Some(secs_str) = tokens.next() {
                            ttl = secs_str.parse::<u64>().ok();
                        }
                    }
                }
                Ok(Command::Set {
                    key: key.to_string(),
                    val: val.to_string(),
                    ttl_secs: ttl,
                })
            }
            "DEL" => {
                let key = tokens.next().ok_or("DEL requires a key")?;
                Ok(Command::Del { key: key.to_string() })
            }
            "TTL" => {
                let key = tokens.next().ok_or("TTL requires a key")?;
                Ok(Command::Ttl { key: key.to_string() })
            }
            unknown => Err(format!("Unknown command '{}'", unknown)),
        }
    }
}
`,
      },
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        content: `[package]
name = "mini_redis"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
      },
    ],
  },

  // ==========================================
  // PROJECT 2: AXUM PRODUCTION REST API
  // ==========================================
  {
    id: 'axum-microservice',
    title: 'Axum Production Microservice & Clean Architecture',
    category: 'Web & Backend',
    difficulty: 'Intermediate',
    estimatedHours: '8 - 12 hours',
    description:
      'Build a production-grade web API featuring domain models, request validation, authentication token verification, centralized error responses with HTTP status mapping, and repository dependency injection.',
    realWorldImpact:
      'The foundational blueprint for 90% of modern enterprise backend microservices handling millions of API calls daily with sub-millisecond latencies.',
    crates: ['axum = "0.7"', 'tokio = "1.0"', 'serde = "1.0"', 'tower = "0.4"'],
    architectureDiagram: `+---------------------------------------------------------------------------------+
|                      AXUM PRODUCTION REST API BLUEPRINT                         |
|                                                                                 |
|   HTTP Request                                                                  |
|   GET /api/v1/users/42                                                          |
|         |                                                                       |
|         v                                                                       |
|   +-----------------------------------------------------------------------+     |
|   | ROUTER & MIDDLEWARE STACK                                              |     |
|   | - TraceLogging (computes request duration)                             |     |
|   | - AuthGuard (validates Authorization Bearer token)                     |     |
|   +-----------------------------------------------------------------------+     |
|         |                                                                       |
|         v                                                                       |
|   +-----------------------------------------------------------------------+     |
|   | HANDLERS (Controllers)                                                |     |
|   | async fn get_user(State(repo), Path(id)) -> Result<Json<User>, Error> |     |
|   +-----------------------------------------------------------------------+     |
|         |                                                                       |
|         v                                                                       |
|   +-----------------------------------------------------------------------+     |
|   | DOMAIN SERVICE & REPOSITORY LAYER                                     |     |
|   | Database trait queries in-memory store or Postgres                    |     |
|   +-----------------------------------------------------------------------+     |
|         |                                                                       |
|         v                                                                       |
|   +-----------------------------------------------------------------------+     |
|   | CENTRALIZED ERROR MAPPER (IntoResponse)                               |     |
|   | AppError::NotFound -> 404 { "error": "User 42 does not exist" }      |     |
|   +-----------------------------------------------------------------------+     |
+---------------------------------------------------------------------------------+`,
    moduleBreakdown: [
      {
        path: 'src/main.rs',
        role: 'Server router initialization, state composition, and simulated HTTP dispatch',
        keyTypes: 'AppState, AppRouter',
      },
      {
        path: 'src/handlers.rs',
        role: 'HTTP controller functions taking typed extractors',
        keyTypes: 'get_user_handler, create_user_handler, health_check',
      },
      {
        path: 'src/models.rs',
        role: 'Domain entities, DTOs, and strongly typed AppError enum',
        keyTypes: 'User, CreateUserDto, AppError, ApiResponse',
      },
    ],
    milestones: [
      {
        step: 1,
        title: 'Define Models & Error Taxonomy',
        objective: 'Construct typed structs for requests and responses with custom AppError.',
        keyTasks: [
          'Create `struct User { id: u64, username: String, email: String, is_active: bool }`',
          'Create `enum AppError { NotFound(String), BadRequest(String), Unauthorized }`',
          'Map each error variant to status code and JSON output',
        ],
        proTip: 'Never leak database internal errors to clients; map internal errors to a generic 500 while logging details on the server.',
      },
      {
        step: 2,
        title: 'Build the In-Memory Repository',
        objective: 'Implement thread-safe CRUD operations with concurrent reader access.',
        keyTasks: [
          'Store users in `Arc<RwLock<HashMap<u64, User>>>`',
          'Implement `.find_by_id()` and `.insert()` with duplicate email detection',
        ],
        proTip: 'Use atomic IDs (`AtomicU64`) to safely generate auto-incrementing user IDs without database locking.',
      },
      {
        step: 3,
        title: 'Write Handlers with Axum Extractors',
        objective: 'Write clean, un-nested functions using Rust types.',
        keyTasks: [
          'Validate input strings (e.g. email must contain "@")',
          'Return `Result<(u16, String), AppError>`',
        ],
        proTip: 'Keep handlers under 20 lines by moving all domain rules into helper methods on the model.',
      },
    ],
    pitfallsToAvoid: [
      {
        trap: 'Using unwrap() in web route handlers',
        explanation: 'Any unwrap on a None or Err will panic and crash the active thread or connection.',
        solution: 'Always bubble errors using the `?` operator returning `Result<T, AppError>`.',
      },
    ],
    starterWorkspace: [
      {
        path: 'src/main.rs',
        name: 'main.rs',
        isEntry: true,
        content: `//! Axum Clean Architecture Web Service Demo
//! Simulates request dispatching, extractors, shared state, and error handling.

mod models;
mod handlers;

use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use models::{User, CreateUserDto, AppError};
use handlers::UserRepo;

fn main() {
    println!("=== Starting Axum Clean Architecture Service ===");
    let repo = UserRepo::new();

    // 1. Seed initial admin user
    let admin = repo.create_user(CreateUserDto {
        username: "ferris".into(),
        email: "ferris@rust-lang.org".into(),
    }).expect("Failed to create admin");
    println!("Created User #{}: {} <{}>", admin.id, admin.username, admin.email);

    // 2. Query user by ID (Found -> 200 OK)
    match repo.get_user(1) {
        Ok(user) => println!("GET /users/1 -> OK: {:?}", user),
        Err(err) => println!("GET /users/1 -> Error: {:?}", err),
    }

    // 3. Query non-existent user (Not Found -> 404)
    match repo.get_user(99) {
        Ok(user) => println!("GET /users/99 -> OK: {:?}", user),
        Err(err) => println!("GET /users/99 -> Handled Error: {:?}", err),
    }

    // 4. Validation error test (Bad email format -> 400 Bad Request)
    let bad_req = repo.create_user(CreateUserDto {
        username: "bot".into(),
        email: "invalid_email_no_at".into(),
    });
    println!("Invalid Creation Result: {:?}", bad_req);

    println!("=== Service Dispatch Verified Successfully ===");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_user_flow() {
        let repo = UserRepo::new();
        let user = repo.create_user(CreateUserDto {
            username: "alice".into(),
            email: "alice@example.com".into(),
        }).unwrap();
        assert_eq!(user.id, 1);
        assert_eq!(user.username, "alice");

        let fetched = repo.get_user(1).unwrap();
        assert_eq!(fetched.email, "alice@example.com");
    }
}
`,
      },
      {
        path: 'src/models.rs',
        name: 'models.rs',
        content: `//! Domain Models & Error Taxonomy

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct User {
    pub id: u64,
    pub username: String,
    pub email: String,
    pub is_active: bool,
}

#[derive(Debug, Clone)]
pub struct CreateUserDto {
    pub username: String,
    pub email: String,
}

#[derive(Debug, PartialEq, Eq)]
pub enum AppError {
    NotFound(String),
    ValidationError(String),
    Conflict(String),
}

impl AppError {
    pub fn http_status_code(&self) -> u16 {
        match self {
            AppError::NotFound(_) => 404,
            AppError::ValidationError(_) => 400,
            AppError::Conflict(_) => 409,
        }
    }
}
`,
      },
      {
        path: 'src/handlers.rs',
        name: 'handlers.rs',
        content: `//! Repository and Controller Handlers

use std::sync::{Arc, RwLock};
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use crate::models::{User, CreateUserDto, AppError};

#[derive(Clone)]
pub struct UserRepo {
    users: Arc<RwLock<HashMap<u64, User>>>,
    next_id: Arc<AtomicU64>,
}

impl UserRepo {
    pub fn new() -> Self {
        Self {
            users: Arc::new(RwLock::new(HashMap::new())),
            next_id: Arc::new(AtomicU64::new(1)),
        }
    }

    pub fn get_user(&self, id: u64) -> Result<User, AppError> {
        let map = self.users.read().unwrap();
        map.get(&id)
            .cloned()
            .ok_or_else(|| AppError::NotFound(format!("User #{} not found", id)))
    }

    pub fn create_user(&self, dto: CreateUserDto) -> Result<User, AppError> {
        // Validation check
        if !dto.email.contains('@') {
            return Err(AppError::ValidationError("Email must contain '@'".into()));
        }

        let mut map = self.users.write().unwrap();
        for u in map.values() {
            if u.email == dto.email {
                return Err(AppError::Conflict("Email is already registered".into()));
            }
        }

        let id = self.next_id.fetch_add(1, Ordering::SeqCst);
        let user = User {
            id,
            username: dto.username,
            email: dto.email,
            is_active: true,
        };

        map.insert(id, user.clone());
        Ok(user)
    }
}
`,
      },
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        content: `[package]
name = "axum_clean_architecture"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
      },
    ],
  },

  // ==========================================
  // PROJECT 3: BEVY 2D SPACE ARCADE ENGINE
  // ==========================================
  {
    id: 'bevy-space-arcade',
    title: 'Bevy 2D Space Arcade Simulation (ECS Engine)',
    category: 'Game Engines & Simulation',
    difficulty: 'Intermediate',
    estimatedHours: '10 - 14 hours',
    description:
      'Build a complete 2D space shooter simulation engine using the Entity Component System (ECS) architecture with position, velocity, projectile spawning, boundary clamping, and collision physics systems.',
    realWorldImpact:
      'Master the data-oriented architectural pattern used in modern high-performance game engines (Bevy, Unity DOTS, Unreal Mass) and spatial robotics simulations.',
    crates: ['bevy = "0.14"', 'rand = "0.8"'],
    architectureDiagram: `+---------------------------------------------------------------------------------+
|                       BEVY 2D SPACE ARCADE SIMULATION (ECS)                     |
|                                                                                 |
|   TICK 1 (Input & Spawning)                                                     |
|   - Player System moves ship horizontally (Arrow Keys)                          |
|   - Bullet Spawner creates bullet entity at player ship tip                     |
|                                                                                 |
|   TICK 2 (Movement Physics System)                                              |
|   - Iterates all entities with (Position, Velocity) in parallel                 |
|   - Position.x += Velocity.dx * dt                                              |
|   - Position.y += Velocity.dy * dt                                              |
|                                                                                 |
|   TICK 3 (AABB Collision Detection System)                                      |
|   - Checks bounding box overlaps between Bullet entities and Asteroids          |
|   - On Collision: Destroys both entities, increments Score Resource             |
|                                                                                 |
|   TICK 4 (Despawn Off-Screen Entities)                                          |
|   - Removes bullets and asteroids that flew outside viewport bounds             |
+---------------------------------------------------------------------------------+`,
    moduleBreakdown: [
      {
        path: 'src/main.rs',
        role: 'Simulation runner, game loop ticks, and telemetry logger',
        keyTypes: 'GameEngine, main',
      },
      {
        path: 'src/ecs.rs',
        role: 'World container, Entity allocations, and Component definitions',
        keyTypes: 'World, Position, Velocity, Collider, EntityKind',
      },
      {
        path: 'src/systems.rs',
        role: 'Pure system functions: physics, collision detection, and score tracking',
        keyTypes: 'tick_movement, tick_collisions, tick_boundaries',
      },
    ],
    milestones: [
      {
        step: 1,
        title: 'Define ECS Data Components',
        objective: 'Create pure data structs without any inheritance.',
        keyTasks: [
          'Create `struct Position { x: f32, y: f32 }` and `struct Velocity { dx: f32, dy: f32 }`',
          'Create `struct Collider { radius: f32 }` for circle collision',
        ],
        proTip: 'Derive `Debug`, `Clone`, and `Copy` for components to make passing them into systems zero-overhead.',
      },
      {
        step: 2,
        title: 'Implement the Movement System',
        objective: 'Update all positions simultaneously based on velocity and delta time (dt).',
        keyTasks: [
          'Zip positions and velocities together and add `dx * dt` and `dy * dt`',
        ],
        proTip: 'Always multiply movement by `dt` (seconds passed) so the game runs at identical speed on 60 Hz or 144 Hz screens.',
      },
      {
        step: 3,
        title: 'Implement Circle-Circle Collision Detection',
        objective: 'Detect when lasers hit asteroids using Pythagorean distance check.',
        keyTasks: [
          'Calculate `dx = x2 - x1` and `dy = y2 - y1`',
          'Check if `dx * dx + dy * dy <= (r1 + r2) * (r1 + r2)`',
        ],
        proTip: 'Avoid calculating square roots (`.sqrt()`); compare squared distances instead to save CPU cycles.',
      },
    ],
    pitfallsToAvoid: [
      {
        trap: 'Modifying an array while iterating over it',
        explanation: 'Removing an entity from a Vec during a `for` loop causes index shifting and out-of-bounds panics.',
        solution: 'Collect entity IDs marked for deletion into a `Vec<usize>` and remove them in reverse order after iteration.',
      },
    ],
    starterWorkspace: [
      {
        path: 'src/main.rs',
        name: 'main.rs',
        isEntry: true,
        content: `//! 2D Space Arcade Simulation (ECS)
//! Demonstrates entity component systems, physics, and collision detection.

mod ecs;
mod systems;

use ecs::{World, EntityKind};
use systems::{tick_movement, tick_collisions};

fn main() {
    println!("=== FerrisForge 2D Space Arcade Simulation (ECS) ===");
    let mut world = World::new();

    // 1. Spawn Player Ship
    let player_id = world.spawn(
        EntityKind::Player,
        0.0, 0.0,    // Center of screen
        0.0, 0.0,    // Stationary
        16.0         // 16px collision radius
    );
    println!("Spawned Player entity #{}", player_id);

    // 2. Spawn Asteroid heading towards center
    let asteroid_id = world.spawn(
        EntityKind::Asteroid,
        100.0, 0.0,  // Spawning to the right
        -20.0, 0.0,  // Moving left at 20 px/sec
        24.0         // 24px collision radius
    );
    println!("Spawned Asteroid entity #{}", asteroid_id);

    // 3. Player fires Laser Cannon!
    let laser_id = world.spawn(
        EntityKind::Bullet,
        10.0, 0.0,   // Fired from front of player ship
        80.0, 0.0,   // Fast projectile moving right at 80 px/sec
        4.0          // Small 4px laser tip
    );
    println!("Player fired Laser entity #{}", laser_id);

    // 4. Run Game Loop for 2 seconds (0.5s ticks)
    let dt = 0.5;
    for tick in 1..=4 {
        println!("--- Simulation Tick {} (dt = {}s) ---", tick, dt);
        tick_movement(&mut world, dt);
        let hits = tick_collisions(&mut world);
        if hits > 0 {
            println!("BOOM! Asteroid destroyed! +100 Score. Hits: {}", hits);
            break;
        }
    }

    println!("Remaining active entities: {}", world.active_count());
    println!("=== Space Simulation Completed Successfully ===");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_collision_resolution() {
        let mut world = World::new();
        world.spawn(EntityKind::Bullet, 10.0, 10.0, 0.0, 0.0, 5.0);
        world.spawn(EntityKind::Asteroid, 12.0, 10.0, 0.0, 0.0, 5.0);

        let hits = tick_collisions(&mut world);
        assert_eq!(hits, 1);
        assert_eq!(world.active_count(), 0); // Both destroyed
    }
}
`,
      },
      {
        path: 'src/ecs.rs',
        name: 'ecs.rs',
        content: `//! ECS Storage Tables & Components

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum EntityKind {
    Player,
    Bullet,
    Asteroid,
}

#[derive(Debug, Clone, Copy)]
pub struct Position { pub x: f32, pub y: f32 }

#[derive(Debug, Clone, Copy)]
pub struct Velocity { pub dx: f32, pub dy: f32 }

#[derive(Debug, Clone, Copy)]
pub struct Collider { pub radius: f32 }

pub struct World {
    pub kinds: Vec<Option<EntityKind>>,
    pub positions: Vec<Position>,
    pub velocities: Vec<Velocity>,
    pub colliders: Vec<Collider>,
}

impl World {
    pub fn new() -> Self {
        Self {
            kinds: Vec::new(),
            positions: Vec::new(),
            velocities: Vec::new(),
            colliders: Vec::new(),
        }
    }

    pub fn spawn(&mut self, kind: EntityKind, x: f32, y: f32, dx: f32, dy: f32, radius: f32) -> usize {
        let id = self.kinds.len();
        self.kinds.push(Some(kind));
        self.positions.push(Position { x, y });
        self.velocities.push(Velocity { dx, dy });
        self.colliders.push(Collider { radius });
        id
    }

    pub fn despawn(&mut self, id: usize) {
        if id < self.kinds.len() {
            self.kinds[id] = None;
        }
    }

    pub fn is_alive(&self, id: usize) -> bool {
        self.kinds.get(id).copied().flatten().is_some()
    }

    pub fn active_count(&self) -> usize {
        self.kinds.iter().filter(|k| k.is_some()).count()
    }
}
`,
      },
      {
        path: 'src/systems.rs',
        name: 'systems.rs',
        content: `//! Systems Logic: Physics & Collision Passes

use crate::ecs::{World, EntityKind};

pub fn tick_movement(world: &mut World, dt: f32) {
    for i in 0..world.kinds.len() {
        if world.is_alive(i) {
            world.positions[i].x += world.velocities[i].dx * dt;
            world.positions[i].y += world.velocities[i].dy * dt;
            println!(
                "  Entity #{:?} ({:?}) pos -> ({:.1}, {:.1})",
                i, world.kinds[i].unwrap(), world.positions[i].x, world.positions[i].y
            );
        }
    }
}

pub fn tick_collisions(world: &mut World) -> usize {
    let mut hits = 0;
    let mut to_despawn = Vec::new();

    for i in 0..world.kinds.len() {
        if world.kinds[i] != Some(EntityKind::Bullet) {
            continue;
        }

        for j in 0..world.kinds.len() {
            if world.kinds[j] != Some(EntityKind::Asteroid) {
                continue;
            }

            let p1 = world.positions[i];
            let p2 = world.positions[j];
            let r1 = world.colliders[i].radius;
            let r2 = world.colliders[j].radius;

            let dx = p1.x - p2.x;
            let dy = p1.y - p2.y;
            let dist_sq = dx * dx + dy * dy;
            let min_dist = r1 + r2;

            if dist_sq <= min_dist * min_dist {
                to_despawn.push(i);
                to_despawn.push(j);
                hits += 1;
                break;
            }
        }
    }

    for id in to_despawn {
        world.despawn(id);
    }

    hits
}
`,
      },
      {
        path: 'Cargo.toml',
        name: 'Cargo.toml',
        content: `[package]
name = "bevy_space_arcade"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
      },
    ],
  },
];
