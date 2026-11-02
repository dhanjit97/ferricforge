/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DsaTopic {
  id: string;
  title: string;
  category: 'core-memory' | 'lists-stacks' | 'trees-graphs' | 'algorithms';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  timeComplexity: {
    access?: string;
    search?: string;
    insertion?: string;
    deletion?: string;
  };
  spaceComplexity: string;
  rustParadigm: string;
  whyTrickyInRust: string;
  memoryDiagram: string;
  conceptExplanation: string[];
  keyRules: string[];
  code: string;
}

export const DSA_TOPICS: DsaTopic[] = [
  {
    id: 'singly-linked-list',
    title: 'Singly Linked List & Stack (Recursive Box)',
    category: 'lists-stacks',
    difficulty: 'Beginner',
    timeComplexity: {
      access: 'O(n)',
      search: 'O(n)',
      insertion: 'O(1) at head',
      deletion: 'O(1) at head',
    },
    spaceComplexity: 'O(n)',
    rustParadigm: 'Option<Box<Node<T>>> (Exclusive Recursive Ownership)',
    whyTrickyInRust:
      'In C or Java, nodes hold raw pointers or garbage-collected references. In Rust, a standard reference `&Node` requires someone else to own the node for a specific lifetime! The idiomatic solution is `Box<Node<T>>`, where each node is allocated on the heap and exclusively owns the next node, terminating with `None`.',
    memoryDiagram: `
[Stack: List]
┌─────────────────────┐
│ head: Option<Box>   │────┐ (Points to heap)
└─────────────────────┘    │
                           ▼
[Heap Allocation 1]    [Heap Allocation 2]    [End]
┌─────────────────┐    ┌─────────────────┐    ┌──────┐
│ elem: 42        │    │ elem: 84        │    │ None │
│ next: Some(Box) ┼───►│ next: None      │────►      │
└─────────────────┘    └─────────────────┘    └──────┘
`,
    conceptExplanation: [
      'Rust requires all types to have a known size at compile time. An enum `enum Node { Cons(T, Node) }` has infinite recursive size! `Box<T>` solves this by introducing a fixed 8-byte pointer to heap memory.',
      '`Option::take()` is the secret weapon for linked lists: it replaces `self.head` with `None` and gives you ownership of the old head without violating the borrow checker.',
      'Implementing `IntoIter`, `Iter`, and `IterMut` demonstrates the 3 borrowing modes of Rust (by-value, shared borrow, mutable borrow).'
    ],
    keyRules: [
      'Never use raw pointers `*mut T` unless writing unsafe low-level drivers.',
      'Use `Option::take()` to extract a node out of a mutable reference cleanly.',
      'Implement `Drop` manually if list could be very long to prevent call-stack overflow from recursive dropping.'
    ],
    code: `//! Production-Grade Singly Linked List in Rust
//! Demonstrates: Box<T>, Option::take(), and Iterator patterns.

pub struct List<T> {
    head: Option<Box<Node<T>>>,
    size: usize,
}

struct Node<T> {
    elem: T,
    next: Option<Box<Node<T>>>,
}

impl<T> List<T> {
    pub fn new() -> Self {
        List { head: None, size: 0 }
    }

    pub fn push(&mut self, elem: T) {
        let new_node = Box::new(Node {
            elem,
            // Option::take() extracts the value out of the Option, leaving None in its place.
            next: self.head.take(),
        });
        self.head = Some(new_node);
        self.size += 1;
    }

    pub fn pop(&mut self) -> Option<T> {
        self.head.take().map(|node| {
            self.head = node.next;
            self.size -= 1;
            node.elem
        })
    }

    pub fn peek(&self) -> Option<&T> {
        self.head.as_ref().map(|node| &node.elem)
    }

    pub fn len(&self) -> usize {
        self.size
    }

    pub fn is_empty(&self) -> bool {
        self.size == 0
    }
}

// Custom Drop implementation to prevent stack overflow when dropping large lists
impl<T> Drop for List<T> {
    fn drop(&mut self) {
        let mut cur_link = self.head.take();
        while let Some(mut boxed_node) = cur_link {
            cur_link = boxed_node.next.take();
        }
    }
}

fn main() {
    println!("=== Singly Linked List (Option<Box<Node<T>>>) ===");
    let mut list = List::new();
    list.push(10);
    list.push(20);
    list.push(30);

    println!("Peek top element: {:?}", list.peek());
    println!("List length: {}", list.len());

    println!("Popped: {:?}", list.pop()); // 30
    println!("Popped: {:?}", list.pop()); // 20
    println!("Popped: {:?}", list.pop()); // 10
    println!("Popped from empty: {:?}", list.pop()); // None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_push_pop() {
        let mut list = List::new();
        list.push("Rust");
        list.push("Ferris");
        assert_eq!(list.peek(), Some(&"Ferris"));
        assert_eq!(list.pop(), Some("Ferris"));
        assert_eq!(list.pop(), Some("Rust"));
        assert_eq!(list.pop(), None);
    }
}
`,
  },
  {
    id: 'doubly-linked-list-lru',
    title: 'Doubly Linked List & LRU Cache (Rc + RefCell + Weak)',
    category: 'lists-stacks',
    difficulty: 'Advanced',
    timeComplexity: {
      access: 'O(1) with HashMap',
      search: 'O(n) / O(1) in LRU',
      insertion: 'O(1) at head/tail',
      deletion: 'O(1) given node ref',
    },
    spaceComplexity: 'O(n)',
    rustParadigm: 'Rc<RefCell<Node<T>>> & Weak<RefCell<Node<T>>> (Shared Interior Mutability)',
    whyTrickyInRust:
      'In a doubly linked list, node A points to node B, and node B points back to node A. If both hold strong references (`Rc`), reference count NEVER drops to 0—causing an incurable memory leak (cyclic reference)! The fix is asymmetric ownership: forward pointers are `Option<Rc<RefCell<Node>>>`, while backward pointers are `Option<Weak<RefCell<Node>>>`.',
    memoryDiagram: `
[Node A]                               [Node B]
┌────────────────────────┐             ┌────────────────────────┐
│ value: 10              │    Rc (Strong)│ value: 20              │
│ next: Option<Rc<Node>> ├────────────►│ next: None             │
│ prev: None             │◄────────────┤ prev: Option<Weak<Node>>│
└────────────────────────┘  Weak (Non- │
                            owning)    └────────────────────────┘
`,
    conceptExplanation: [
      '`Rc<T>` is a reference-counted smart pointer for single-threaded shared ownership.',
      '`RefCell<T>` provides "interior mutability", deferring the borrow checker rules from compile time to runtime via `borrow()` and `borrow_mut()`.',
      '`Rc::downgrade(&rc)` creates a `Weak<T>` pointer that does not increment the strong reference count, breaking memory leak cycles.'
    ],
    keyRules: [
      'Always use `Weak` for back-pointers or parent-pointers to avoid reference cycles.',
      'RefCell runtime panics if you simultaneously call `borrow_mut()` while another borrow is active.',
      'In performance-sensitive production code, index arenas are preferred over Rc<RefCell> due to cache locality.'
    ],
    code: `//! Doubly Linked List with Safe Cyclic Breaking via Rc & Weak
use std::rc::{Rc, Weak};
use std::cell::RefCell;

type NodeRef<T> = Rc<RefCell<Node<T>>>;
type WeakNodeRef<T> = Weak<RefCell<Node<T>>>;

pub struct DoublyLinkedList<T> {
    head: Option<NodeRef<T>>,
    tail: Option<NodeRef<T>>,
    length: usize,
}

struct Node<T> {
    value: T,
    next: Option<NodeRef<T>>,
    prev: Option<WeakNodeRef<T>>,
}

impl<T: std::fmt::Debug> DoublyLinkedList<T> {
    pub fn new() -> Self {
        DoublyLinkedList { head: None, tail: None, length: 0 }
    }

    pub fn push_front(&mut self, value: T) {
        let new_node = Rc::new(RefCell::new(Node {
            value,
            next: self.head.take(),
            prev: None,
        }));

        if let Some(ref old_head) = new_node.borrow().next {
            old_head.borrow_mut().prev = Some(Rc::downgrade(&new_node));
        } else {
            self.tail = Some(Rc::clone(&new_node));
        }

        self.head = Some(new_node);
        self.length += 1;
    }

    pub fn pop_front(&mut self) -> Option<T> {
        self.head.take().map(|old_head| {
            self.length -= 1;
            match old_head.borrow_mut().next.take() {
                Some(next_node) => {
                    next_node.borrow_mut().prev = None;
                    self.head = Some(next_node);
                }
                None => {
                    self.tail = None;
                }
            }
            // If strong count is 1, unwrap yields the value
            Rc::try_unwrap(old_head).ok().unwrap().into_inner().value
        })
    }

    pub fn len(&self) -> usize {
        self.length
    }
}

fn main() {
    println!("=== Doubly Linked List (Rc + RefCell + Weak) ===");
    let mut dlist = DoublyLinkedList::new();
    dlist.push_front(100);
    dlist.push_front(200);
    dlist.push_front(300);

    println!("Length: {}", dlist.len());
    println!("Popped front: {:?}", dlist.pop_front()); // 300
    println!("Popped front: {:?}", dlist.pop_front()); // 200
    println!("Popped front: {:?}", dlist.pop_front()); // 100
    println!("Popped empty: {:?}", dlist.pop_front()); // None
}
`,
  },
  {
    id: 'graph-arena-vector',
    title: 'Cache-Friendly Graph Arena (Index-Based Representation)',
    category: 'trees-graphs',
    difficulty: 'Intermediate',
    timeComplexity: {
      access: 'O(1) by NodeId',
      search: 'O(V + E) for BFS / DFS',
      insertion: 'O(1) amortized',
      deletion: 'O(E) remove edges',
    },
    spaceComplexity: 'O(V + E)',
    rustParadigm: 'Vec<Node> with usize Index Handles (The "Rustacean Way")',
    whyTrickyInRust:
      'Graph nodes have multiple incoming and outgoing edges, creating many-to-many cyclic references. If you try to model this with pointers or references, the borrow checker will fight you at every step. The idiomatic Rust solution used by compilers (rustc itself uses `Arena`), game engines (Bevy), and databases is the Arena Pattern: store all nodes in a flat `Vec<Node>`, and edges are simply `usize` indices (NodeId)!',
    memoryDiagram: `
[Arena: Vec<Node> in contiguous memory]
Index 0: { name: "A", neighbors: [1, 2] } ───► CPU L1/L2 Cache Friendly!
Index 1: { name: "B", neighbors: [2] }    ───► Zero pointer chasing
Index 2: { name: "C", neighbors: [0] }    ───► 100% borrow-checker compliant
Index 3: { name: "D", neighbors: [] }     ───► Zero unsafe code
`,
    conceptExplanation: [
      'Contiguous vector memory has massive performance advantages over heap pointers due to CPU prefetching and cache-line locality.',
      'Index handles (`type NodeId = usize`) are `Copy`, lightweight, and can be freely duplicated and stored in queues and edge lists without lifetime annotations.',
      'Algorithms like BFS, DFS, Dijkstra, and Topological Sort become clean, elegant, and safe.'
    ],
    keyRules: [
      'Define type aliases like `type NodeId = usize` for clarity.',
      'Validate index bounds when querying nodes.',
      'Use `VecDeque` for BFS queue operations and `BinaryHeap` for Dijkstra.'
    ],
    code: `//! High-Performance Graph Arena with BFS & Cycle Detection
//! The canonical Rust way to implement graphs and trees without Rc/RefCell.

use std::collections::{VecDeque, HashSet};

pub type NodeId = usize;

#[derive(Debug, Clone)]
pub struct Node<T> {
    pub id: NodeId,
    pub data: T,
    pub neighbors: Vec<NodeId>,
}

#[derive(Debug, Default)]
pub struct Graph<T> {
    nodes: Vec<Node<T>>,
}

impl<T: Clone + std::fmt::Display> Graph<T> {
    pub fn new() -> Self {
        Graph { nodes: Vec::new() }
    }

    pub fn add_node(&mut self, data: T) -> NodeId {
        let id = self.nodes.len();
        self.nodes.push(Node {
            id,
            data,
            neighbors: Vec::new(),
        });
        id
    }

    pub fn add_edge(&mut self, from: NodeId, to: NodeId) {
        if from < self.nodes.len() && to < self.nodes.len() {
            self.nodes[from].neighbors.push(to);
        }
    }

    /// Breadth-First Search (BFS) starting from a root node
    pub fn bfs(&self, start: NodeId) -> Vec<T> {
        let mut visited = vec![false; self.nodes.len()];
        let mut queue = VecDeque::new();
        let mut result = Vec::new();

        if start >= self.nodes.len() {
            return result;
        }

        visited[start] = true;
        queue.push_back(start);

        while let Some(current_id) = queue.pop_front() {
            let current = &self.nodes[current_id];
            result.push(current.data.clone());

            for &neighbor_id in &current.neighbors {
                if !visited[neighbor_id] {
                    visited[neighbor_id] = true;
                    queue.push_back(neighbor_id);
                }
            }
        }

        result
    }

    /// Detect if the directed graph contains a cycle
    pub fn has_cycle(&self) -> bool {
        let mut visited = vec![false; self.nodes.len()];
        let mut in_stack = vec![false; self.nodes.len()];

        for id in 0..self.nodes.len() {
            if !visited[id] && self.dfs_cycle(id, &mut visited, &mut in_stack) {
                return true;
            }
        }
        false
    }

    fn dfs_cycle(&self, id: NodeId, visited: &mut [bool], in_stack: &mut [bool]) -> bool {
        visited[id] = true;
        in_stack[id] = true;

        for &neighbor in &self.nodes[id].neighbors {
            if !visited[neighbor] {
                if self.dfs_cycle(neighbor, visited, in_stack) {
                    return true;
                }
            } else if in_stack[neighbor] {
                return true;
            }
        }

        in_stack[id] = false;
        false
    }
}

fn main() {
    println!("=== Cache-Friendly Graph Arena ===");
    let mut graph = Graph::new();
    let a = graph.add_node("Tokyo");
    let b = graph.add_node("San Francisco");
    let c = graph.add_node("London");
    let d = graph.add_node("Reykjavik");

    graph.add_edge(a, b);
    graph.add_edge(b, c);
    graph.add_edge(c, d);
    graph.add_edge(d, a); // Cycle!

    let bfs_order = graph.bfs(a);
    println!("BFS Traversal starting from Tokyo: {:?}", bfs_order);
    println!("Contains cycle: {}", graph.has_cycle()); // true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_graph_bfs() {
        let mut g = Graph::new();
        let n0 = g.add_node("Zero");
        let n1 = g.add_node("One");
        let n2 = g.add_node("Two");
        g.add_edge(n0, n1);
        g.add_edge(n0, n2);

        let order = g.bfs(n0);
        assert_eq!(order.len(), 3);
        assert_eq!(order[0], "Zero");
    }
}
`,
  },
  {
    id: 'quicksort-split-at-mut',
    title: 'In-Place QuickSort (slice::split_at_mut)',
    category: 'algorithms',
    difficulty: 'Intermediate',
    timeComplexity: {
      search: 'O(log n)',
      insertion: 'N/A',
      deletion: 'N/A',
      access: 'O(n log n) average, O(n^2) worst',
    },
    spaceComplexity: 'O(log n) auxiliary stack',
    rustParadigm: 'Safe In-Place Slice Disjoint Borrows (`split_at_mut`)',
    whyTrickyInRust:
      'In C++, QuickSort partitions an array and calls `quicksort(&arr[0], mid)` and `quicksort(&arr[mid+1], n)`. In Rust, doing `quicksort(&mut arr[..mid])` followed by `quicksort(&mut arr[mid..])` naive indexing causes a compile error: "cannot borrow `arr` as mutable more than once at a time"! Rust provides `slice::split_at_mut(mid)` as a safe primitive that divides one mutable slice into two disjoint mutable slices that can be borrowed simultaneously.',
    memoryDiagram: `
[Input Slice: &mut [T]]
┌───────────┬───────────┬───────────┬───────────┬───────────┐
│     8     │     3     │     5     │     9     │     2     │
└───────────┴───────────┴───────────┴───────────┴───────────┘
                           ▲ Pivot
        slice.split_at_mut(pivot_idx)
              ┌───────────────────────────┐
              ▼                           ▼
[Left Disjoint Slice: &mut [T]]    [Right Disjoint Slice: &mut [T]]
┌───────────┬───────────┐          ┌───────────┬───────────┐
│     3     │     2     │          │     9     │     8     │
└───────────┴───────────┘          └───────────┴───────────┘
Borrow checker permits both simultaneously because memory regions do NOT overlap!
`,
    conceptExplanation: [
      'Rust’s aliasing XOR mutability rule (`&T` XOR `&mut T`) applies to the whole array unless split into non-overlapping sub-slices.',
      '`slice::split_at_mut(mid)` is implemented using safe internal pointer arithmetic guaranteed by standard library safety audits.',
      'In-place QuickSort uses zero heap allocations and operates directly on cache lines.'
    ],
    keyRules: [
      'Use `slice::split_at_mut` whenever divide-and-conquer algorithms require simultaneous mutable access to left and right halves.',
      'Always use Median-of-Three or randomized pivot to guard against O(n^2) worst-case on pre-sorted inputs.',
      'Remember base condition `if slice.len() <= 1 { return; }` to terminate recursion.'
    ],
    code: `//! In-Place Divide-and-Conquer QuickSort in Safe Rust
//! Demonstrates slice::split_at_mut to satisfy the borrow checker.

pub fn quicksort<T: Ord>(slice: &mut [T]) {
    if slice.len() <= 1 {
        return;
    }

    let pivot_idx = partition(slice);

    // split_at_mut safely bifurcates one mutable borrow into two non-overlapping borrows:
    // left = slice[0..pivot_idx]
    // right = slice[pivot_idx + 1..]
    let (left, rest) = slice.split_at_mut(pivot_idx);
    let right = &mut rest[1..];

    quicksort(left);
    quicksort(right);
}

fn partition<T: Ord>(slice: &mut [T]) -> usize {
    let len = slice.len();
    let pivot_idx = len - 1; // Lomuto partition: last element as pivot
    let mut i = 0;

    for j in 0..pivot_idx {
        if slice[j] <= slice[pivot_idx] {
            slice.swap(i, j);
            i += 1;
        }
    }

    slice.swap(i, pivot_idx);
    i
}

fn main() {
    println!("=== In-Place QuickSort via split_at_mut ===");
    let mut numbers = vec![34, 7, 23, 32, 5, 62, 1, 99, 14];
    println!("Original: {:?}", numbers);

    quicksort(&mut numbers);
    println!("Sorted:   {:?}", numbers);

    let mut words = vec!["ferris", "crab", "rust", "borrow", "ownership", "zero-cost"];
    quicksort(&mut words);
    println!("Words:    {:?}", words);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_quicksort() {
        let mut data = vec![9, 3, 7, 1, 8, 2, 5, 4, 6];
        quicksort(&mut data);
        assert_eq!(data, vec![1, 2, 3, 4, 5, 6, 7, 8, 9]);
    }

    #[test]
    fn test_already_sorted() {
        let mut data = vec![1, 2, 3, 4, 5];
        quicksort(&mut data);
        assert_eq!(data, vec![1, 2, 3, 4, 5]);
    }
}
`,
  },
  {
    id: 'binary-search-tree',
    title: 'Binary Search Tree & Traversal (Recursive Box)',
    category: 'trees-graphs',
    difficulty: 'Intermediate',
    timeComplexity: {
      search: 'O(log n) avg / O(n) worst',
      insertion: 'O(log n) avg / O(n) worst',
      deletion: 'O(log n) avg / O(n) worst',
      access: 'O(log n)',
    },
    spaceComplexity: 'O(n)',
    rustParadigm: 'Option<Box<TreeNode<T>>> (Hierarchical Exclusive Ownership)',
    whyTrickyInRust:
      'Unlike C++ where nodes have `parent` pointers, introducing parent pointers in Rust would create reference cycles. A pure BST in Rust maintains downward exclusive ownership from root to leaf via `Option<Box<TreeNode<T>>>`. Traversals (in-order, pre-order, post-order) are cleanly written with recursive borrows `&self.left`.',
    memoryDiagram: `
          [Root: 50]
          ┌────────┐
          │   50   │
     ┌────┴────────┴────┐
     ▼                  ▼
 [Left: 30]        [Right: 70]
 ┌────────┐        ┌────────┐
 │   30   │        │   70   │
 └────────┘        └────────┘
Downwards exclusive heap ownership via Option<Box<Node>>.
`,
    conceptExplanation: [
      '`TreeNode` has `left: Option<Box<TreeNode<T>>>` and `right: Option<Box<TreeNode<T>>>`.',
      'In-order traversal yields elements in sorted order naturally.',
      'Search uses tail recursion or simple while loops following `&mut` or `&` references.'
    ],
    keyRules: [
      'Use pattern matching `match &self.root` to inspect tree state.',
      'To insert, walk down with mutable references `let mut cur = &mut self.root`.',
      'For balanced trees in production, use standard library `BTreeMap` which is optimized for cache lines.'
    ],
    code: `//! Safe Binary Search Tree (BST) in Rust
//! Downward exclusive ownership model with in-order traversal.

pub struct BST<T: Ord> {
    root: Option<Box<TreeNode<T>>>,
    size: usize,
}

struct TreeNode<T: Ord> {
    val: T,
    left: Option<Box<TreeNode<T>>>,
    right: Option<Box<TreeNode<T>>>,
}

impl<T: Ord + Clone> BST<T> {
    pub fn new() -> Self {
        BST { root: None, size: 0 }
    }

    pub fn insert(&mut self, val: T) {
        if self.insert_rec(&mut self.root, val) {
            self.size += 1;
        }
    }

    fn insert_rec(node: &mut Option<Box<TreeNode<T>>>, val: T) -> bool {
        match node {
            None => {
                *node = Some(Box::new(TreeNode {
                    val,
                    left: None,
                    right: None,
                }));
                true
            }
            Some(n) => {
                if val < n.val {
                    Self::insert_rec(&mut n.left, val)
                } else if val > n.val {
                    Self::insert_rec(&mut n.right, val)
                } else {
                    false // Duplicate value
                }
            }
        }
    }

    pub fn contains(&self, val: &T) -> bool {
        let mut cur = &self.root;
        while let Some(n) = cur {
            if val < &n.val {
                cur = &n.left;
            } else if val > &n.val {
                cur = &n.right;
            } else {
                return true;
            }
        }
        false
    }

    pub fn in_order_traversal(&self) -> Vec<T> {
        let mut result = Vec::new();
        Self::collect_in_order(&self.root, &mut result);
        result
    }

    fn collect_in_order(node: &Option<Box<TreeNode<T>>>, acc: &mut Vec<T>) {
        if let Some(n) = node {
            Self::collect_in_order(&n.left, acc);
            acc.push(n.val.clone());
            Self::collect_in_order(&n.right, acc);
        }
    }

    pub fn len(&self) -> usize {
        self.size
    }
}

fn main() {
    println!("=== Binary Search Tree (BST) ===");
    let mut bst = BST::new();
    bst.insert(50);
    bst.insert(30);
    bst.insert(70);
    bst.insert(20);
    bst.insert(40);
    bst.insert(60);
    bst.insert(80);

    println!("Contains 40: {}", bst.contains(&40)); // true
    println!("Contains 99: {}", bst.contains(&99)); // false
    println!("In-order sorted elements: {:?}", bst.in_order_traversal());
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bst() {
        let mut tree = BST::new();
        tree.insert(5);
        tree.insert(2);
        tree.insert(8);
        assert!(tree.contains(&2));
        assert!(!tree.contains(&10));
        assert_eq!(tree.in_order_traversal(), vec![2, 5, 8]);
    }
}
`,
  },
  {
    id: 'prefix-trie',
    title: 'Prefix Tree / Trie for Autocomplete & Search',
    category: 'trees-graphs',
    difficulty: 'Intermediate',
    timeComplexity: {
      search: 'O(k) where k = word length',
      insertion: 'O(k)',
      deletion: 'O(k)',
    },
    spaceComplexity: 'O(ALPHABET_SIZE * k * N)',
    rustParadigm: 'std::collections::HashMap<char, TrieNode> (Hierarchical Map)',
    whyTrickyInRust:
      'In a Trie, each node branches to child characters. Using fixed-size arrays `[Option<Box<TrieNode>>; 26]` wastes memory for Unicode or sparse sets. Using `HashMap<char, TrieNode>` provides full Unicode support with zero unsafe code and automatic recursive deallocation when dropped.',
    memoryDiagram: `
[Root]
  ├── 'r' ──► [Node: is_end=false]
  │             └── 'u' ──► [Node: is_end=false]
  │                           └── 's' ──► [Node: is_end=false]
  │                                         └── 't' ──► [Node: is_end=true ("rust")]
  └── 'f' ──► [Node: is_end=false]
                └── 'a' ──► [Node: is_end=false]
                              └── 's' ──► [Node: is_end=false]
                                            └── 't' ──► [Node: is_end=true ("fast")]
`,
    conceptExplanation: [
      'Each Trie node owns a hash map of child characters and a boolean `is_end_of_word`.',
      'Prefix search checks if a path exists from root, allowing instant autocomplete lookup.',
      'Insertion traverses downward, inserting new children with `entry().or_insert_with()`.',
    ],
    keyRules: [
      'Use `char` instead of `u8` to support Unicode characters cleanly.',
      'Leverage `std::collections::HashMap::entry` API for idiomatic branch creation.',
      'Collect matching words using DFS helper on the prefix subtree.'
    ],
    code: `//! Unicode-Ready Trie (Prefix Tree) in Idiomatic Rust
use std::collections::HashMap;

#[derive(Default, Debug)]
pub struct Trie {
    root: TrieNode,
}

#[derive(Default, Debug)]
struct TrieNode {
    children: HashMap<char, TrieNode>,
    is_end: bool,
}

impl Trie {
    pub fn new() -> Self {
        Trie {
            root: TrieNode::default(),
        }
    }

    pub fn insert(&mut self, word: &str) {
        let mut cur = &mut self.root;
        for ch in word.chars() {
            cur = cur.children.entry(ch).or_default();
        }
        cur.is_end = true;
    }

    pub fn search(&self, word: &str) -> bool {
        self.find_node(word).map_or(false, |node| node.is_end)
    }

    pub fn starts_with(&self, prefix: &str) -> bool {
        self.find_node(prefix).is_some()
    }

    pub fn autocomplete(&self, prefix: &str) -> Vec<String> {
        let mut results = Vec::new();
        if let Some(prefix_node) = self.find_node(prefix) {
            let mut path = prefix.to_string();
            Self::dfs_collect(prefix_node, &mut path, &mut results);
        }
        results
    }

    fn find_node(&self, prefix: &str) -> Option<&TrieNode> {
        let mut cur = &self.root;
        for ch in prefix.chars() {
            cur = cur.children.get(&ch)?;
        }
        Some(cur)
    }

    fn dfs_collect(node: &TrieNode, path: &mut String, results: &mut Vec<String>) {
        if node.is_end {
            results.push(path.clone());
        }

        for (&ch, child_node) in &node.children {
            path.push(ch);
            Self::dfs_collect(child_node, path, results);
            path.pop();
        }
    }
}

fn main() {
    println!("=== Trie (Prefix Tree) Autocomplete ===");
    let mut trie = Trie::new();
    trie.insert("rust");
    trie.insert("rustacean");
    trie.insert("runtime");
    trie.insert("running");
    trie.insert("ruby");
    trie.insert("ferris");

    println!("Search 'rust': {}", trie.search("rust")); // true
    println!("Search 'rus': {}", trie.search("rus"));   // false
    println!("Starts with 'ru': {}", trie.starts_with("ru")); // true

    let suggestions = trie.autocomplete("ru");
    println!("Autocomplete for 'ru': {:?}", suggestions);
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_trie() {
        let mut t = Trie::new();
        t.insert("apple");
        assert!(t.search("apple"));
        assert!(!t.search("app"));
        assert!(t.starts_with("app"));
        t.insert("app");
        assert!(t.search("app"));
    }
}
`,
  },
  {
    id: 'sliding-window-two-pointers',
    title: 'Two Pointers & Sliding Window Algorithms',
    category: 'algorithms',
    difficulty: 'Beginner',
    timeComplexity: {
      access: 'O(n) linear scan',
      search: 'O(n)',
    },
    spaceComplexity: 'O(1) in-place',
    rustParadigm: 'Slice Indexing & Mutable Pointer Windows (&mut [T])',
    whyTrickyInRust:
      'In C/C++, programmers freely manipulate two raw pointers `int *left` and `int *right`. In Rust, you can do this cleanly with slice indexing without bounds-check overhead if using iterators, or by using `.windows()` and split ranges.',
    memoryDiagram: `
[Slice: &mut [T]]
Index:   0    1    2    3    4    5
Array: [ 2,   1,   5,   1,   3,   2 ]
         ▲              ▲
      [left]        [right]  --> Window moves forward with sum = sum + right - left
`,
    conceptExplanation: [
      'Sliding window transforms O(n^2) nested loops into O(n) single-pass linear algorithms.',
      'Two pointers moving towards each other (e.g. Dutch National Flag, Two Sum on sorted slice).',
      'Rust’s iterator adapters (`windows`, `chunks`, `enumerate`) make sliding window code idiomatic and zero-overhead.'
    ],
    keyRules: [
      'Maintain invariant: right pointer expands window, left pointer contracts when condition broken.',
      'Keep track of running sum or frequency map across sliding transitions.',
      'Avoid unnecessary allocations inside the inner loop.'
    ],
    code: `//! High-Performance Sliding Window & Two Pointers in Rust

/// Find maximum sum of any contiguous subarray of size k (O(n) time, O(1) space)
pub fn max_sub_array_of_size_k(k: usize, nums: &[i32]) -> Option<i32> {
    if nums.len() < k || k == 0 {
        return None;
    }

    // Initialize first window
    let mut window_sum: i32 = nums[..k].iter().sum();
    let mut max_sum = window_sum;

    // Slide window by subtracting element leaving and adding element entering
    for i in k..nums.len() {
        window_sum += nums[i] - nums[i - k];
        max_sum = max_sum.max(window_sum);
    }

    Some(max_sum)
}

/// Two-Sum on Sorted Slice: returns 1-based indices (O(n) time, O(1) space)
pub fn two_sum_sorted(numbers: &[i32], target: i32) -> Option<(usize, usize)> {
    let mut left = 0;
    let mut right = numbers.len().checked_sub(1)?;

    while left < right {
        let sum = numbers[left] + numbers[right];
        if sum == target {
            return Some((left + 1, right + 1));
        } else if sum < target {
            left += 1;
        } else {
            right -= 1;
        }
    }

    None
}

fn main() {
    println!("=== Sliding Window & Two Pointers ===");
    let nums = vec![2, 1, 5, 1, 3, 2];
    let k = 3;
    let max_k = max_sub_array_of_size_k(k, &nums);
    println!("Max subarray sum of size {}: {:?}", k, max_k); // 9 (5 + 1 + 3)

    let sorted = vec![2, 7, 11, 15];
    let target = 9;
    let pair = two_sum_sorted(&sorted, target);
    println!("Two sum indices for target {}: {:?}", target, pair); // (1, 2)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_max_window() {
        let arr = vec![1, 4, 2, 10, 23, 3, 1, 0, 20];
        assert_eq!(max_sub_array_of_size_k(4, &arr), Some(39));
    }

    #[test]
    fn test_two_sum() {
        let arr = vec![1, 3, 4, 6, 8, 10];
        assert_eq!(two_sum_sorted(&arr, 11), Some((2, 5)));
    }
}
`,
  },
];
