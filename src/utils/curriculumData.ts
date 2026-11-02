export type LearningStage = 1 | 2 | 3 | 4 | 5;

export const calculateLevelFromXp = (totalXp: number): { level: number; levelTitle: string; title: string; progressRatio: number } => {
  if (totalXp < 50) return { level: 1, levelTitle: 'Novice Crab', title: 'Novice Crab', progressRatio: totalXp / 50 };
  if (totalXp < 150) return { level: 2, levelTitle: 'Rust Rookie', title: 'Rust Rookie', progressRatio: (totalXp - 50) / 100 };
  if (totalXp < 300) return { level: 3, levelTitle: 'Rustacean', title: 'Rustacean', progressRatio: (totalXp - 150) / 150 };
  if (totalXp < 600) return { level: 4, levelTitle: 'Systems Programmer', title: 'Systems Programmer', progressRatio: (totalXp - 300) / 300 };
  if (totalXp < 1000) return { level: 5, levelTitle: 'Systems Architect', title: 'Systems Architect', progressRatio: (totalXp - 600) / 400 };
  if (totalXp < 1500) return { level: 6, levelTitle: 'Systems Architect', title: 'Systems Architect', progressRatio: (totalXp - 1000) / 500 };
  return { level: 7, levelTitle: 'Rust Grandmaster', title: 'Rust Grandmaster', progressRatio: 1 };
};

export const LEARNING_STAGES: Record<LearningStage, { title: string; description: string }> = {
  1: { title: 'Programming from Zero', description: 'Learn what programming is, how computers execute instructions, and write your first Rust programs.' },
  2: { title: 'Understanding Rust', description: 'Master Rust fundamentals: ownership, borrowing, structs, enums, Option/Result, and error handling.' },
  3: { title: 'Intermediate Rust', description: 'Go deeper with generics, traits, lifetimes, closures, iterators, smart pointers, modules, and concurrency.' },
  4: { title: 'Advanced Rust', description: 'Explore async Rust, Tokio, macros, unsafe Rust, and performance optimization.' },
  5: { title: 'Real-World Development', description: 'Build production applications with Axum, Tokio, Bevy, Ratatui, Tauri, and CLI tools.' },
};

export interface KnowledgeCheckQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CurriculumLesson {
  id: string;
  trackId: string;
  trackTitle: string;
  stage: LearningStage;
  title: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Systems & Engines';
  estimatedMinutes: number;
  xpReward: number;
  overview: string;
  guideContent: string;
  walkthroughCode: string;
  walkthroughExplanations: {
    lineRange: string;
    headline: string;
    explanation: string;
  }[];
  exercise: {
    id: string;
    title: string;
    description: string;
    requirements: string[];
    starterCode: string;
    solutionCode: string;
    hints: { level: number; title: string; content: string }[];
    verificationCriteria: string;
  };
  knowledgeCheck?: KnowledgeCheckQuestion[];
}

export interface UserProgress {
  totalXp: number;
  level: number;
  levelTitle: string;
  completedLessonIds: string[];
  viewedLessonIds: string[];
  knowledgeCheckResults: Record<string, boolean[]>;
  conceptMastery: Record<string, boolean>;
  unlockedHintIndices: Record<string, number[]>;
  achievements: {
    id: string;
    title: string;
    description: string;
    unlockedAt?: string;
  }[];
  schemaVersion?: number;
}

export const CURRICULUM_LESSONS: CurriculumLesson[] = [
  // ==========================================
  // STAGE 1: PROGRAMMING FROM ZERO
  // ==========================================
  {
    id: 'programming-intro',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'What is Programming?',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 30,
    overview: 'Learn what programming is, how computers execute instructions, and why Rust is a great first language.',
    guideContent: [
      'Programming is giving a computer a set of step-by-step instructions to follow.',
      'Computers are very fast but they cannot think for themselves—they only do exactly what you tell them.',
      '',
      'Inside every computer are billions of tiny switches called bits.',
      'Each bit is either OFF (0) or ON (1). Groups of 8 bits make 1 byte.',
      'Everything you see on screen—text, images, videos—is stored as patterns of bits.',
      '',
      'A programming language lets humans write instructions that the computer can understand.',
      'Rust is a modern language that is:',
      '- Safe: It prevents many common bugs before you run your program',
      '- Fast: It runs nearly as fast as C and C++',
      '- Clear: It forces you to be explicit about how memory is used',
      '',
      'Here is a tiny Rust program:',
      '',
      'fn main() {',
      '    println!("Hello, world!");',
      '}',
      '',
      'fn main() defines the entry point—the place where the program starts running.',
      'println!() is a macro that prints text to the screen.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    println!("Hello, world!");',
      '    println!("I am learning Rust!");',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 1', headline: 'Entry Point', explanation: 'fn main() is where Rust starts executing your program. Every Rust program needs a main function.' },
      { lineRange: 'Lines 2-3', headline: 'Printing to Screen', explanation: 'println!() prints text to the screen. The ! means it is a macro, not a regular function.' },
    ],

    exercise: {
      id: 'ex-programming-intro',
      title: 'Exercise: Say Hello',
      description: 'Modify the code to print your name and a greeting message.',
      requirements: ['Print a greeting message using println!', 'Print your name on a separate line'],
      starterCode: [
        'fn main() {',
        '    // TODO: Print "Hello, world!"',
        '    // TODO: Print your name',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    println!("Hello, world!");',
        '    println!("Your Name");',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Print macro', content: 'Use println!("your text here"); to print text.' },
        { level: 2, title: 'Two lines', content: 'Use two separate println!() calls, one for each line.' },
      ],
      verificationCriteria: 'Program prints two lines of output.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does a computer do when you run a program?', options: ['It thinks creatively about what you want', 'It follows your step-by-step instructions exactly', 'It guesses what you meant'], correctAnswerIndex: 1, explanation: 'Computers follow instructions exactly as written. They do not guess or improvise.' },
      { id: 'q2', question: 'What is a bit?', options: ['A tiny switch that is either OFF (0) or ON (1)', 'A unit of memory that stores text', 'A type of computer chip'], correctAnswerIndex: 0, explanation: 'A bit is the smallest unit of data—a switch that is either off (0) or on (1).' },
      { id: 'q3', question: 'In the program above, what runs first?', options: ['Everything at once', 'The code inside fn main()', 'The last line of code'], correctAnswerIndex: 1, explanation: 'Rust starts executing from fn main().' },
    ],
  },

  {
    id: 'first-rust-program',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Your First Rust Program',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 30,
    overview: 'Write and run your first complete Rust program. Learn how to compile and execute code.',
    guideContent: [
      '### Your First Rust Program',
      '',
      'In this lesson you will write, compile, and run a complete Rust program.',
      '',
      '### The Program Structure',
      '',
      'Every Rust program starts with fn main(). The code inside { } is what runs.',
      '',
      'fn main() {',
      '    println!("Hello, Rust!");',
      '}',
      '',
      '### How to Run',
      '',
      '1. Type or paste the code into the editor on the left',
      '2. Click the Run button (or press Ctrl+Enter)',
      '3. Look at the output in the Terminal panel on the right',
      '',
      '### Common Mistakes',
      '',
      '- Forgetting the curly braces { } around the function body',
      '- Forgetting the semicolon ; after println!()',
      '- Typing Main instead of main (Rust is case-sensitive)',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    println!("Hello, Rust!");',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 1', headline: 'Function Definition', explanation: 'fn main() defines the main function. This is where your program starts.' },
      { lineRange: 'Line 2', headline: 'Print Statement', explanation: 'println!() prints text to the screen. The ! means it is a macro, not a regular function.' },
    ],

    exercise: {
      id: 'ex-first-rust-program',
      title: 'Exercise: Personal Greeting',
      description: 'Write a program that prints your name and age.',
      requirements: ['Print a greeting message', 'Print your name', 'Print your age as a number'],
      starterCode: [
        'fn main() {',
        '    // TODO: Print your greeting',
        '    // TODO: Print your name',
        '    // TODO: Print your age',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    println!("Hello, I am learning Rust!");',
        '    println!("My name is Alex");',
        '    println!("I am 25 years old");',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Print statement', content: 'Use println!("text"); to print text.' },
        { level: 2, title: 'Printing numbers', content: 'You can print numbers directly: println!(25); works for numbers too.' },
      ],
      verificationCriteria: 'Program prints greeting, name, and age.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What is the entry point of every Rust program?', options: ['main()', 'start()', 'begin()'], correctAnswerIndex: 0, explanation: 'Every Rust program starts executing from fn main().' },
      { id: 'q2', question: 'What does println! do?', options: ['Calculates a mathematical formula', 'Prints text to the screen', 'Creates a new variable'], correctAnswerIndex: 1, explanation: 'println! prints text to the terminal output.' },
    ],
  },

  {
    id: 'variables-mutability',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Variables & Mutability',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn how to store data in variables and why Rust makes them immutable by default.',
    guideContent: [
      '### Variables & Mutability',
      '',
      'A variable is a named storage location in memory. Think of it as a labeled box where you can store a value.',
      '',
      '### Creating Variables',
      '',
      'In Rust, you create variables with let:',
      '',
      'let score = 100;',
      'let name = "Alice";',
      '',
      '### Immutability by Default',
      '',
      'In Rust, variables are immutable by default. Once you assign a value, you cannot change it:',
      '',
      'let score = 100;',
      '// score = 200; // Error! Cannot assign twice to immutable variable',
      '',
      '### Mutable Variables',
      '',
      'To allow changes, add mut:',
      '',
      'let mut score = 100;',
      'score = 200; // Allowed!',
      '',
      '### Why Immutability?',
      '',
      'Rust makes variables immutable by default to prevent bugs. If you do not explicitly mark something as mut, you know it will not change unexpectedly.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let score = 100;',
      '    // score = 150; // This would cause an error!',
      '',
      '    let mut health = 100;',
      '    health = 75; // This is allowed!',
      '    println!("Health: {}", health);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 2', headline: 'Immutable Variable', explanation: 'let score = 100 creates an immutable variable. You cannot change it later.' },
      { lineRange: 'Line 4-5', headline: 'Mutable Variable', explanation: 'let mut health = 100 creates a mutable variable. You can change its value later.' },
    ],

    exercise: {
      id: 'ex-variables-mutability',
      title: 'Exercise: Temperature Tracker',
      description: 'Track temperature changes using mutable variables.',
      requirements: ['Create a mutable variable temperature set to 20', 'Change it to 25', 'Print the final temperature'],
      starterCode: [
        'fn main() {',
        '    // TODO: Create mutable temperature variable',
        '    // TODO: Change temperature to 25',
        '    // TODO: Print the temperature',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let mut temperature = 20;',
        '    temperature = 25;',
        '    println!("Temperature: {}", temperature);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Mutable declaration', content: 'Use let mut temperature = 20; to create a mutable variable.' },
        { level: 2, title: 'Assignment', content: 'Use temperature = 25; to change the value.' },
      ],
      verificationCriteria: 'Program prints Temperature: 25.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What keyword creates a variable in Rust?', options: ['var', 'let', 'create'], correctAnswerIndex: 1, explanation: 'let is the keyword used to declare variables in Rust.' },
      { id: 'q2', question: 'Can you change an immutable variable after creating it?', options: ['Yes', 'No'], correctAnswerIndex: 1, explanation: 'Immutable variables cannot be changed after creation. Use mut if you need to change them.' },
      { id: 'q3', question: 'How do you make a variable mutable?', options: ['Add mut before the variable name', 'Use change keyword', 'It is not possible'], correctAnswerIndex: 0, explanation: 'Add mut after let to make a variable mutable: let mut x = 5;' },
    ],
  },

  {
    id: 'data-types',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Data Types',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    xpReward: 40,
    overview: 'Learn about Rust number types (i8, u8, i32, u64), booleans, characters, and strings.',
    guideContent: [
      '### Data Types',
      '',
      'Every value in Rust has a type. The type tells the computer what kind of data is stored and how much memory to use.',
      '',
      '### Number Types',
      '',
      'Rust has many number types. The letter tells you if it can be negative:',
      '',
      'i types (signed): can be positive or negative (i8, i16, i32, i64, i128)',
      'u types (unsigned): can only be zero or positive (u8, u16, u32, u64, u128)',
      '',
      'The number tells you how many bits of memory it uses:',
      '- u8: 0 to 255 (perfect for colors: RGB)',
      '- i32: -2.1 billion to +2.1 billion (Rust\'s default for integers)',
      '- u64: 0 to 18 quintillion (for large numbers like timestamps)',
      '',
      '### Other Common Types',
      '',
      '- bool: true or false',
      "- char: A single character like 'A', '🦀', '7'",
      '- &str: A slice of text (string slice)',
      '- f64: Decimal numbers like 3.14159',
      '',
      '### Why So Many Types?',
      '',
      'Using the right type saves memory and prevents bugs. You cannot store -5 in a u8 because unsigned types cannot be negative!',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let age: u8 = 25;',
      '    let temperature: i32 = -10;',
      '    let is_rusty: bool = true;',
      "    let grade: char = 'A';",
      '    let message: &str = "Hello";',
      '',
      '    println!("Age: {}", age);',
      '    println!("Temperature: {}°C", temperature);',
      '    println!("Is Rusty: {}", is_rusty);',
      '    println!("Grade: {}", grade);',
      '    println!("Message: {}", message);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 2-6', headline: 'Variable Declarations with Types', explanation: 'Each variable has an explicit type. is_rusty is bool (true/false), grade is char (single char).' },
      { lineRange: 'Lines 8-12', headline: 'Printing Variables', explanation: 'println! with {} placeholders inserts variable values into the string.' },
    ],

    exercise: {
      id: 'ex-data-types',
      title: 'Exercise: Temperature Converter Variables',
      description: 'Declare variables for temperature conversion and print them.',
      requirements: ['Create a variable celsius of type i32 set to 25', 'Create a variable fahrenheit of type f64 set to 77.0', 'Create a variable is_freezing of type bool based on whether celsius is 0', 'Print all three variables'],
      starterCode: [
        'fn main() {',
        '    // TODO: Declare celsius: i32 = 25',
        '    // TODO: Declare fahrenheit: f64 = 77.0',
        '    // TODO: Declare is_freezing: bool',
        '    // TODO: Print all variables',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let celsius: i32 = 25;',
        '    let fahrenheit: f64 = 77.0;',
        '    let is_freezing: bool = celsius == 0;',
        '',
        '    println!("Celsius: {}", celsius);',
        '    println!("Fahrenheit: {}", fahrenheit);',
        '    println!("Is freezing: {}", is_freezing);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Type annotations', content: 'Use let celsius: i32 = 25; to explicitly set the type.' },
        { level: 2, title: 'Boolean comparison', content: 'Use celsius == 0 to check if celsius equals zero.' },
      ],
      verificationCriteria: 'Program declares and prints all three variables correctly.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does the i in i32 stand for?', options: ['Integer (signed - can be negative)', 'Imaginary', 'Index'], correctAnswerIndex: 0, explanation: 'i stands for Integer and means the type can store negative numbers.' },
      { id: 'q2', question: 'What is the range of u8?', options: ['0 to 255', '-128 to 127', '0 to 65535'], correctAnswerIndex: 0, explanation: 'u8 is unsigned 8-bit, so it ranges from 0 to 255.' },
      { id: 'q3', question: "Which type would you use for a person's age?", options: ['u8 (ages are positive and small)', 'i32 (ages can be negative)', 'f64 (ages have decimals)'], correctAnswerIndex: 0, explanation: 'Ages are always positive and typically small, so u8 (0-255) is perfect.' },
    ],
  },

  {
    id: 'operators-expressions',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Operators & Expressions',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 30,
    overview: 'Learn how to do math and comparisons in Rust.',
    guideContent: [
      '### Operators & Expressions',
      '',
      'Operators let you do math and comparisons in Rust.',
      '',
      '### Arithmetic Operators',
      '',
      'let sum = 10 + 5;      // 15',
      'let diff = 10 - 5;     // 5',
      'let prod = 10 * 5;     // 50',
      'let quot = 10 / 5;     // 2',
      'let rem  = 10 % 3;     // 1 (remainder)',
      '',
      '### Comparison Operators',
      '',
      'let equal = 5 == 5;    // true',
      'let not_equal = 5 != 3; // true',
      'let greater = 10 > 3;   // true',
      'let less = 3 < 10;      // true',
      '',
      '### Integer Division',
      '',
      'When you divide two integers, the result is truncated:',
      '',
      'let result = 7 / 2;    // 3, not 3.5',
      '',
      'To get decimals, use floating-point numbers:',
      '',
      'let result = 7.0 / 2.0; // 3.5',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let a = 10;',
      '    let b = 3;',
      '',
      '    println!("Sum: {}", a + b);',
      '    println!("Remainder: {}", a % b);',
      '    println!("Equal: {}", a == b);',
      '    println!("Greater: {}", a > b);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 4-7', headline: 'Arithmetic Operations', explanation: '+, -, *, /, % perform addition, subtraction, multiplication, division, and remainder.' },
      { lineRange: 'Lines 8-9', headline: 'Comparisons', explanation: '== checks equality, > checks greater than. Both return true or false.' },
    ],

    exercise: {
      id: 'ex-operators-expressions',
      title: 'Exercise: Calculator',
      description: 'Perform basic calculations and print results.',
      requirements: ['Create variables a and b with values 15 and 4', 'Print sum, difference, product, and remainder', 'Print whether a is greater than b'],
      starterCode: [
        'fn main() {',
        '    let a = 15;',
        '    let b = 4;',
        '    // TODO: Print sum, difference, product, remainder',
        '    // TODO: Print whether a > b',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let a = 15;',
        '    let b = 4;',
        '',
        '    println!("Sum: {}", a + b);',
        '    println!("Difference: {}", a - b);',
        '    println!("Product: {}", a * b);',
        '    println!("Remainder: {}", a % b);',
        '    println!("a > b: {}", a > b);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Arithmetic operators', content: 'Use +, -, *, /, % for basic math.' },
        { level: 2, title: 'Comparison', content: 'Use > to check if one number is greater than another.' },
      ],
      verificationCriteria: 'Program prints correct results for all operations.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does 10 % 3 equal?', options: ['1 (remainder when 10 is divided by 3)', '3 (10 divided by 3)', '10 (remainder is always the first number)'], correctAnswerIndex: 0, explanation: '% is the remainder operator. 10 divided by 3 is 3 remainder 1.' },
      { id: 'q2', question: 'What does 7 / 2 equal when both are integers?', options: ['3 (integer division truncates)', '3.5', '4 (rounded up)'], correctAnswerIndex: 0, explanation: 'Integer division discards the fractional part, so 7 / 2 = 3.' },
      { id: 'q3', question: 'What does 5 == 5 return?', options: ['true', 'false', 'An error'], correctAnswerIndex: 0, explanation: '== checks equality, and 5 equals 5, so it returns true.' },
    ],
  },

  {
    id: 'conditions',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Conditions (if/else)',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn how to make decisions in your code using if/else statements.',
    guideContent: [
      '### Conditions (if/else)',
      '',
      'Sometimes your program needs to make decisions. Use if to check a condition:',
      '',
      'let score = 85;',
      '',
      'if score >= 60 {',
      '    println!("Passed!");',
      '} else {',
      '    println!("Failed!");',
      '}',
      '',
      '### Multiple Conditions',
      '',
      'Use else if for multiple checks:',
      '',
      'let score = 85;',
      '',
      'if score >= 90 {',
      '    println!("Grade: A");',
      '} else if score >= 80 {',
      '    println!("Grade: B");',
      '} else if score >= 70 {',
      '    println!("Grade: C");',
      '} else {',
      '    println!("Grade: F");',
      '}',
      '',
      'Rust checks each condition in order and stops at the first one that is true.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let score = 75;',
      '',
      '    if score >= 90 {',
      '        println!("Grade: A");',
      '    } else if score >= 80 {',
      '        println!("Grade: B");',
      '    } else if score >= 70 {',
      '        println!("Grade: C");',
      '    } else {',
      '        println!("Grade: F");',
      '    }',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 4-10', headline: 'If/Else Chain', explanation: 'Rust checks each condition in order. Since score is 75, it matches score >= 70 and prints Grade: C.' },
    ],

    exercise: {
      id: 'ex-conditions',
      title: 'Exercise: Temperature Warning',
      description: 'Check temperature and print appropriate warning.',
      requirements: ['Create a variable temperature set to 35', 'If temperature > 30, print "Hot warning!"', 'Else if temperature < 10, print "Cold warning!"', 'Else print "Temperature is normal"'],
      starterCode: [
        'fn main() {',
        '    let temperature = 35;',
        '    // TODO: Add if/else if/else to check temperature',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let temperature = 35;',
        '',
        '    if temperature > 30 {',
        '        println!("Hot warning!");',
        '    } else if temperature < 10 {',
        '        println!("Cold warning!");',
        '    } else {',
        '        println!("Temperature is normal");',
        '    }',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'If condition', content: 'Use if temperature > 30 to check if temperature is greater than 30.' },
        { level: 2, title: 'Else if', content: 'Add else if temperature < 10 for the second condition.' },
        { level: 3, title: 'Else', content: 'Use else for the default case when no other condition matches.' },
      ],
      verificationCriteria: 'Program prints Hot warning! for temperature 35.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does if do?', options: ['Repeats code forever', 'Checks a condition and runs code if it is true', 'Creates a variable'], correctAnswerIndex: 1, explanation: 'if evaluates a condition and runs the block only if it is true.' },
      { id: 'q2', question: 'What happens if none of the if or else if conditions are true?', options: ['Nothing runs', 'The else block runs (if present)', 'The program crashes'], correctAnswerIndex: 1, explanation: 'The else block runs as a fallback when no other condition matches.' },
      { id: 'q3', question: 'In if score >= 60, what does >= mean?', options: ['Greater than or equal to', 'Less than or equal to', 'Equal to'], correctAnswerIndex: 0, explanation: '>= means greater than or equal to.' },
    ],
  },

  {
    id: 'loops',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Loops',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn how to repeat code using loops.',
    guideContent: [
      '### Loops',
      '',
      'Loops let you repeat code multiple times.',
      '',
      '### Loop Types',
      '',
      'Rust has three kinds of loops:',
      '',
      'loop - Runs forever until you break:',
      '',
      'let mut count = 0;',
      'loop {',
      '    println!("Count: {}", count);',
      '    count += 1;',
      '    if count >= 3 { break; }',
      '}',
      '',
      'while - Runs while a condition is true:',
      '',
      'let mut count = 0;',
      'while count < 3 {',
      '    println!("Count: {}", count);',
      '    count += 1;',
      '}',
      '',
      'for - Iterates over a range:',
      '',
      'for i in 0..3 {',
      '    println!("Count: {}", i);',
      '}',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    for i in 0..3 {',
      '        println!("Count: {}", i);',
      '    }',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 2', headline: 'For Loop', explanation: 'for i in 0..3 iterates over the range 0, 1, 2. The variable i takes each value in turn.' },
    ],

    exercise: {
      id: 'ex-loops',
      title: 'Exercise: Countdown',
      description: 'Print a countdown from 5 to 1, then Blast off!',
      requirements: ['Use a for loop', 'Print numbers 5, 4, 3, 2, 1', 'Print Blast off! after the loop'],
      starterCode: [
        'fn main() {',
        '    // TODO: Print countdown from 5 to 1',
        '    // TODO: Print "Blast off!"',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    for i in (1..=5).rev() {',
        '        println!("{}", i);',
        '    }',
        '    println!("Blast off!");',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Range syntax', content: 'Use (1..=5).rev() to iterate from 5 down to 1.' },
        { level: 2, title: 'Print after loop', content: 'Add println!("Blast off!"); after the for loop.' },
      ],
      verificationCriteria: 'Program prints 5, 4, 3, 2, 1, then Blast off!.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'Which loop runs forever unless you break?', options: ['loop', 'while', 'for'], correctAnswerIndex: 0, explanation: 'The loop keyword creates an infinite loop that only stops when you use break.' },
      { id: 'q2', question: 'What does 0..3 produce?', options: ['0, 1, 2, 3', '0, 1, 2', '1, 2, 3'], correctAnswerIndex: 1, explanation: '0..3 is a range that excludes the end, so it produces 0, 1, 2.' },
      { id: 'q3', question: 'Which loop is best for iterating over a known range?', options: ['loop', 'while', 'for'], correctAnswerIndex: 2, explanation: 'for loops are designed for iterating over ranges and collections.' },
    ],
  },

  {
    id: 'functions',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'Functions & Parameters',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn how to write reusable functions with parameters and return values.',
    guideContent: [
      '### Functions & Parameters',
      '',
      'Functions let you group code into reusable blocks. You define them once and call them many times.',
      '',
      '### Defining a Function',
      '',
      'fn greet(name: &str) {',
      '    println!("Hello, {}!", name);',
      '}',
      '',
      '### Calling a Function',
      '',
      'fn main() {',
      '    greet("Alice");',
      '    greet("Bob");',
      '}',
      '',
      '### Return Values',
      '',
      'Functions can return values using -> Type:',
      '',
      'fn add(a: i32, b: i32) -> i32 {',
      '    a + b',
      '}',
      '',
      'fn main() {',
      '    let result = add(5, 3);',
      '    println!("Result: {}", result); // 8',
      '}',
      '',
      'Note: The last expression without a semicolon is automatically returned.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let result = add(5, 3);',
      '    println!("Result: {}", result);',
      '}',
      '',
      'fn add(a: i32, b: i32) -> i32 {',
      '    a + b',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 6-8', headline: 'Function Definition', explanation: 'fn add takes two i32 parameters and returns their sum. The last expression a + b is returned automatically.' },
    ],

    exercise: {
      id: 'ex-functions',
      title: 'Exercise: Area Calculator',
      description: 'Write a function that calculates the area of a rectangle.',
      requirements: ['Create a function area(width: i32, height: i32) -> i32', 'The function should return width * height', 'Call the function and print the result'],
      starterCode: [
        'fn main() {',
        '    // TODO: Call area function and print result',
        '}',
        '',
        'fn area(width: i32, height: i32) -> i32 {',
        '    // TODO: Return width * height',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let result = area(10, 5);',
        '    println!("Area: {}", result);',
        '}',
        '',
        'fn area(width: i32, height: i32) -> i32 {',
        '    width * height',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Return expression', content: 'The last line without a semicolon is returned: width * height.' },
        { level: 2, title: 'Call function', content: 'Call area(10, 5) and store the result in a variable.' },
      ],
      verificationCriteria: 'Program prints Area: 50.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What keyword defines a function?', options: ['func', 'fn', 'function'], correctAnswerIndex: 1, explanation: 'fn is the keyword used to define functions in Rust.' },
      { id: 'q2', question: 'What does -> i32 mean?', options: ['The function takes no arguments', 'The function returns an i32 value', 'The function modifies an i32 variable'], correctAnswerIndex: 1, explanation: '-> i32 means the function returns a value of type i32.' },
      { id: 'q3', question: 'In fn add(a: i32, b: i32) -> i32, what are a and b?', options: ['Return values', 'Parameters (inputs)', 'Local variables'], correctAnswerIndex: 1, explanation: 'a and b are parameters—the inputs the function receives.' },
    ],
  },

  {
    id: 'user-input',
    trackId: 'stage-1',
    trackTitle: '1. Programming from Zero',
    stage: 1,
    title: 'User Input',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 30,
    overview: 'Learn how to read input from the user.',
    guideContent: [
      '### User Input',
      '',
      'Programs become more useful when they can accept input from users.',
      '',
      '### Reading Input',
      '',
      'Rust uses the std::io module to read input:',
      '',
      'use std::io;',
      '',
      'fn main() {',
      '    let mut name = String::new();',
      '    io::stdin().read_line(&mut name).unwrap();',
      '    println!("Hello, {}", name);',
      '}',
      '',
      '### Key Concepts',
      '',
      '- String::new() creates an empty string',
      '- &mut name passes a mutable reference so the function can modify it',
      '- .unwrap() handles the result (we will learn about error handling later)',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let mut name = String::new();',
      '    io::stdin().read_line(&mut name).unwrap();',
      '    println!("Hello, {}", name);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 2', headline: 'Create Empty String', explanation: 'String::new() creates an empty, mutable string that will hold the user input.' },
      { lineRange: 'Line 3', headline: 'Read Input', explanation: 'io::stdin().read_line(&mut name) reads text from the user and stores it in name.' },
    ],

    exercise: {
      id: 'ex-user-input',
      title: 'Exercise: Greet the User',
      description: 'Ask the user for their name and greet them.',
      requirements: ['Prompt the user for their name', 'Read the input', 'Print a personalized greeting'],
      starterCode: [
        'use std::io;',
        '',
        'fn main() {',
        '    println!("What is your name?");',
        '    let mut name = String::new();',
        '    // TODO: Read input and print greeting',
        '}',
      ].join('\n'),
      solutionCode: [
        'use std::io;',
        '',
        'fn main() {',
        '    println!("What is your name?");',
        '    let mut name = String::new();',
        '    io::stdin().read_line(&mut name).unwrap();',
        '    println!("Hello, {}!", name.trim());',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Read line', content: 'Use io::stdin().read_line(&mut name).unwrap(); to read user input.' },
        { level: 2, title: 'Trim newline', content: 'Use .trim() to remove the newline character from the input.' },
      ],
      verificationCriteria: 'Program reads user input and prints a personalized greeting.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What module do you use for input/output?', options: ['std::io', 'std::input', 'std::console'], correctAnswerIndex: 0, explanation: 'std::io provides input and output functionality in Rust.' },
      { id: 'q2', question: 'What does &mut mean?', options: ['A mutable reference (can be changed)', 'A constant reference (cannot be changed)', 'A new variable'], correctAnswerIndex: 0, explanation: '&mut creates a mutable reference that allows the referenced value to be changed.' },
      { id: 'q3', question: 'What does String::new() do?', options: ['Creates an empty string', 'Deletes a string', 'Prints a string'], correctAnswerIndex: 0, explanation: 'String::new() creates a new empty String.' },
    ],
  },

  // ==========================================
  // STAGE 2: UNDERSTANDING RUST
  // ==========================================

  {
    id: 'ownership-move',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Ownership & Move Semantics',
    difficulty: 'Intermediate',
    estimatedMinutes: 15,
    xpReward: 50,
    overview: "Learn Rust's ownership system: each value has exactly one owner, and when the owner goes out of scope, the value is dropped.",
    guideContent: [
      '### Ownership & Move Semantics',
      '',
      "In Rust, every value has a single **owner**. When the owner goes out of scope, the value is automatically cleaned up.",
      '',
      '### The Library Book Metaphor',
      '',
      "Imagine a library book. Only one person can own (check out) the book at a time:",
      '',
      'let book = String::from("Rust Book");',
      'let friend = book; // Ownership MOVES to friend',
      '',
      'When you assign book to friend, ownership moves. You cannot use book anymore because friend now owns it.',
      '',
      '### Why This Matters',
      '',
      'This prevents double-free bugs (two owners trying to clean up the same memory) and dangling pointers (pointing to memory that has been freed).',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let s1 = String::from("hello");',
      '    let s2 = s1; // Ownership moves to s2',
      '    // println!("{}", s1); // Error: s1 no longer owns the value',
      '    println!("{}", s2); // OK: s2 owns the value',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 3', headline: 'Ownership Move', explanation: 'When s2 = s1 executes, ownership of the string data moves from s1 to s2. s1 is now invalid.' },
    ],

    exercise: {
      id: 'ex-ownership-move',
      title: 'Exercise: Ownership Transfer',
      description: 'Practice moving ownership between variables.',
      requirements: ['Create a variable data with a String value', 'Move it to other', 'Print other (not data)'],
      starterCode: [
        'fn main() {',
        '    let data = String::from("Important data");',
        '    // TODO: Move ownership to other',
        '    // TODO: Print other',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let data = String::from("Important data");',
        '    let other = data; // Ownership moves to other',
        '    println!("{}", other);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Move ownership', content: 'Use let other = data; to move ownership.' },
        { level: 2, title: 'Print new owner', content: 'Print other, not data.' },
      ],
      verificationCriteria: 'Program prints Important data using the other variable.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What happens when you assign one variable to another in Rust?', options: ['Both variables own the value', 'Ownership moves to the new variable', 'The value is copied automatically'], correctAnswerIndex: 1, explanation: 'For types like String, assignment moves ownership—only the new variable can use the value.' },
      { id: 'q2', question: 'What happens when the owner goes out of scope?', options: ['The value is leaked', 'The value is automatically cleaned up', 'Nothing happens'], correctAnswerIndex: 1, explanation: 'Rust automatically drops (frees) the value when its owner goes out of scope.' },
      { id: 'q3', question: 'Can you use a variable after its ownership has moved?', options: ['Yes', 'No'], correctAnswerIndex: 1, explanation: 'No—after ownership moves, the original variable is invalid and cannot be used.' },
    ],
  },

  {
    id: 'borrowing-references',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Borrowing & References',
    difficulty: 'Intermediate',
    estimatedMinutes: 15,
    xpReward: 50,
    overview: 'Learn how to borrow values using references (& and &mut) without taking ownership.',
    guideContent: [
      '### Borrowing & References',
      '',
      'Instead of taking ownership, you can borrow a value using a reference.',
      '',
      '### Immutable References (&T)',
      '',
      'Multiple immutable references can exist at the same time:',
      '',
      'let s1 = String::from("hello");',
      'let r1 = &s1; // Borrow immutably',
      'let r2 = &s1; // Borrow immutably again - OK!',
      'println!("{} and {}", r1, r2);',
      '',
      '### Mutable References (&mut T)',
      '',
      'Only ONE mutable reference can exist at a time:',
      '',
      'let mut s = String::from("hello");',
      'let r1 = &mut s; // Mutable borrow',
      '// let r2 = &mut s; // Error! Cannot borrow mutably again',
      'r1.push_str(" world");',
      'println!("{}", s);',
      '',
      '### The Golden Rule',
      '',
      'You can have either:',
      '- Any number of immutable references (&T), OR',
      '- Exactly ONE mutable reference (&mut T),',
      '',
      'But never both at the same time.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let mut s = String::from("hello");',
      '',
      '    let r1 = &s; // Immutable borrow',
      '    let r2 = &s; // Another immutable borrow - OK!',
      '    println!("{} and {}", r1, r2);',
      '',
      '    let r3 = &mut s; // Mutable borrow - OK because r1, r2 are no longer used',
      '    r3.push_str(" world");',
      '    println!("{}", s);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 2-4', headline: 'Multiple Immutable Borrows', explanation: 'Multiple &s references can exist simultaneously because they only read, never modify.' },
      { lineRange: 'Line 6', headline: 'Mutable Borrow', explanation: '&mut s is allowed because the previous immutable borrows (r1, r2) are no longer used.' },
    ],

    exercise: {
      id: 'ex-borrowing-references',
      title: 'Exercise: Borrow and Modify',
      description: 'Practice borrowing with & and &mut.',
      requirements: ['Create a mutable String variable', 'Borrow it immutably and print it', 'Borrow it mutably and append text', 'Print the result'],
      starterCode: [
        'fn main() {',
        '    let mut text = String::from("Hello");',
        '    // TODO: Borrow immutably and print',
        '    // TODO: Borrow mutably and append " World"',
        '    // TODO: Print the result',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let mut text = String::from("Hello");',
        '',
        '    let r = &text; // Immutable borrow',
        '    println!("{}", r);',
        '',
        '    let m = &mut text; // Mutable borrow',
        '    m.push_str(" World");',
        '    println!("{}", text);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Immutable borrow first', content: 'Use let r = &text; to borrow immutably, then print r.' },
        { level: 2, title: 'Mutable borrow after', content: 'Use let m = &mut text; then m.push_str(" World");.' },
      ],
      verificationCriteria: 'Program prints Hello then Hello World.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'How many immutable references can exist at once?', options: ['Only one', 'As many as you want', 'Exactly two'], correctAnswerIndex: 1, explanation: 'You can have as many immutable references as you want at the same time.' },
      { id: 'q2', question: 'How many mutable references can exist at once?', options: ['Any number', 'Exactly one', 'Two'], correctAnswerIndex: 1, explanation: 'Only one mutable reference (&mut T) can exist at a time.' },
      { id: 'q3', question: 'Can you have both &T and &mut T at the same time?', options: ['Yes', 'No'], correctAnswerIndex: 1, explanation: 'No—you cannot have both immutable and mutable references to the same data simultaneously.' },
    ],
  },

  {
    id: 'slices-references',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Slices (&str)',
    difficulty: 'Beginner',
    estimatedMinutes: 10,
    xpReward: 40,
    overview: 'Learn about string slices (&str) - references to a portion of a string.',
    guideContent: [
      '### Slices (&str)',
      '',
      'A **string slice** (&str) is a reference to a portion of a string. It does not own the data - it just points to it.',
      '',
      '### String vs &str',
      '',
      '- String: Owned, growable, heap-allocated',
      '- &str: A view into existing string data',
      '',
      'String literals like "hello" are actually &str - they are stored in the binary and referenced.',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let s = String::from("hello world");',
      '    let hello = &s[0..5]; // Slice of the first 5 characters',
      '    let world = &s[6..11]; // Slice of the next 5 characters',
      '    println!("{} {}", hello, world);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 2', headline: 'String Slice', explanation: '&s[0..5] creates a reference to the first 5 characters of the string.' },
    ],

    exercise: {
      id: 'ex-slices-references',
      title: 'Exercise: Extract First Word',
      description: 'Write a function that returns the first word of a string as a slice.',
      requirements: ['Create a function first_word(s: &str) -> &str', 'Find the first space and return the slice before it', 'Call the function and print the result'],
      starterCode: [
        'fn main() {',
        '    let sentence = String::from("hello world");',
        '    // TODO: Call first_word and print result',
        '}',
        '',
        'fn first_word(s: &str) -> &str {',
        '    // TODO: Return slice of first word',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let sentence = String::from("hello world");',
        '    let word = first_word(&sentence);',
        '    println!("First word: {}", word);',
        '}',
        '',
        'fn first_word(s: &str) -> &str {',
        '    let bytes = s.as_bytes();',
        '    for (i, &item) in bytes.iter().enumerate() {',
        '        if item == b\' \' {',
        '            return &s[0..i];',
        '        }',
        '    }',
        '    &s[..]',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Find space', content: 'Iterate over bytes to find the first space character.' },
        { level: 2, title: 'Return slice', content: 'Return &s[0..i] where i is the position of the space.' },
      ],
      verificationCriteria: 'Program prints First word: hello.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What is &str?', options: ['An owned, growable string', 'A reference to a portion of string data', 'A character'], correctAnswerIndex: 1, explanation: '&str is a string slice—a reference to a portion of string data.' },
      { id: 'q2', question: 'Can you modify data through &str?', options: ['Yes', 'No - it is immutable'], correctAnswerIndex: 1, explanation: '&str is immutable—you cannot modify the data it points to.' },
    ],
  },

  {
    id: 'structs-methods',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Structs & Methods',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn how to create custom data types with structs and add behavior with methods.',
    guideContent: [
      '### Structs & Methods',
      '',
      'Structs let you group related data together. Methods let you define behavior on that data.',
      '',
      '### Defining a Struct',
      '',
      'struct User {',
      '    username: String,',
      '    email: String,',
      '    active: bool,',
      '}',
      '',
      '### Creating and Using Instances',
      '',
      'let user1 = User {',
      '    username: String::from("ferris"),',
      '    email: String::from("ferris@rustacean.org"),',
      '    active: true,',
      '};',
      '',
      'println!("{} is active: {}", user1.username, user1.active);',
      '',
      '### Methods',
      '',
      'impl User {',
      '    fn greet(&self) {',
      '        println!("Hello, {}!", self.username);',
      '    }',
      '}',
      '',
      'fn main() {',
      '    let user = User { username: String::from("Alice"), email: String::from("alice@example.com"), active: true };',
      '    user.greet();',
      '}',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let user = User {',
      '        username: String::from("Alice"),',
      '        email: String::from("alice@example.com"),',
      '        active: true,',
      '    };',
      '    user.greet();',
      '}',
      '',
      'struct User {',
      '    username: String,',
      '    email: String,',
      '    active: bool,',
      '}',
      '',
      'impl User {',
      '    fn greet(&self) {',
      '        println!("Hello, {}!", self.username);',
      '    }',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 9-15', headline: 'Struct Definition', explanation: 'struct User defines a custom type with three fields: username, email, and active.' },
      { lineRange: 'Lines 17-20', headline: 'Method Implementation', explanation: 'impl User defines methods that can be called on User instances. &self borrows the instance.' },
    ],

    exercise: {
      id: 'ex-structs-methods',
      title: 'Exercise: Rectangle Area',
      description: 'Create a Rectangle struct with an area method.',
      requirements: ['Create a struct Rectangle with width and height fields (both i32)', 'Implement an area method that returns width * height', 'Create an instance and print its area'],
      starterCode: [
        'fn main() {',
        '    // TODO: Create Rectangle instance and print area',
        '}',
        '',
        'struct Rectangle {',
        '    width: i32,',
        '    height: i32,',
        '}',
        '',
        'impl Rectangle {',
        '    fn area(&self) -> i32 {',
        '        // TODO: Return width * height',
        '    }',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let rect = Rectangle { width: 10, height: 5 };',
        '    println!("Area: {}", rect.area());',
        '}',
        '',
        'struct Rectangle {',
        '    width: i32,',
        '    height: i32,',
        '}',
        '',
        'impl Rectangle {',
        '    fn area(&self) -> i32 {',
        '        self.width * self.height',
        '    }',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Create instance', content: 'Create a Rectangle with Rectangle { width: 10, height: 5 }.' },
        { level: 2, title: 'Area calculation', content: 'In the area method, return self.width * self.height.' },
      ],
      verificationCriteria: 'Program prints Area: 50.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What is a struct?', options: ['A function', 'A custom data type that groups related fields', 'A loop construct'], correctAnswerIndex: 1, explanation: 'A struct is a custom data type that groups related fields together.' },
      { id: 'q2', question: 'What is &self in a method?', options: ['A reference to the instance the method is called on', 'A new instance', 'A static value'], correctAnswerIndex: 0, explanation: '&self borrows the instance so the method can read its data without taking ownership.' },
    ],
  },

  {
    id: 'pattern-matching-enums',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Enums & Match',
    difficulty: 'Beginner',
    estimatedMinutes: 15,
    xpReward: 60,
    overview: 'Learn how Enums package options and how Match inspects them without ever missing an edge case.',
    guideContent: [
      '### What is an Enum?',
      '',
      'An enum (short for enumeration) is a type that can be one of several different variants.',
      '',
      'enum TrafficLight {',
      '    Red,',
      '    Yellow,',
      '    Green,',
      '}',
      '',
      '### Rust Enums Can Carry Data',
      '',
      'In Rust, each enum variant can carry its own data:',
      '',
      'enum Notification {',
      '    Email(String),',
      '    Sms(u64),',
      '    SystemBeep,',
      '}',
      '',
      '### What is match?',
      '',
      'match lets you handle each enum variant exhaustively. The compiler requires you to handle every variant.',
    ].join('\n'),

    walkthroughCode: [
      '#[derive(Debug)]',
      'enum PlayerAction {',
      '    Rest,',
      '    Walk { distance_meters: i32 },',
      '    Attack(u32), // power',
      '}',
      '',
      'fn process_action(action: PlayerAction, current_stamina: &mut i32) {',
      '    match action {',
      '        PlayerAction::Rest => {',
      '            *current_stamina += 20;',
      '            println!("Rested! Stamina recovered to {}.", current_stamina);',
      '        }',
      '        PlayerAction::Walk { distance_meters } => {',
      '            let cost = distance_meters / 10;',
      '            *current_stamina -= cost;',
      '            println!("Walked {}m. Stamina is now {}.", distance_meters, current_stamina);',
      '        }',
      '        PlayerAction::Attack(power) => {',
      '            *current_stamina -= 15;',
      '            println!("Attacked with {} power! Stamina is now {}.", power, current_stamina);',
      '        }',
      '    }',
      '}',
      '',
      'fn main() {',
      '    let mut stamina = 100;',
      '    process_action(PlayerAction::Walk { distance_meters: 50 }, &mut stamina);',
      '    process_action(PlayerAction::Attack(75), &mut stamina);',
      '    process_action(PlayerAction::Rest, &mut stamina);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 2-6', headline: 'Defining the Options', explanation: 'PlayerAction defines the exact 3 things a player is allowed to do. No other actions exist.' },
      { lineRange: 'Lines 10-24', headline: 'The Exhaustive Match', explanation: 'Every branch handles one variant. If a new variant is added, Rust requires updating this match.' },
    ],

    exercise: {
      id: 'ex-pattern-matching',
      title: 'Exercise: ATM Bank Account Transaction Engine',
      description: 'Build the ledger logic for an ATM machine. Handle Deposits, Withdrawals, and Transfer transactions safely!',
      requirements: ['Complete apply_transaction(balance: u64, tx: &Transaction) -> Result<u64, String>', 'If Deposit(amount): add the amount to balance and return Ok(balance + amount)', 'If Withdrawal(amount) or Fee(amount): subtract amount if balance is high enough, otherwise return Err("Insufficient funds".to_string())'],
      starterCode: [
        '#[derive(Debug, PartialEq)]',
        'pub enum Transaction {',
        '    Deposit(u64),',
        '    Withdrawal(u64),',
        '    Fee(u64),',
        '}',
        '',
        'pub fn apply_transaction(balance: u64, tx: &Transaction) -> Result<u64, String> {',
        '    // TODO: Use a match on tx to calculate the new balance!',
        '    // Remember: If balance < amount for a withdrawal or fee, return Err("Insufficient funds".to_string())',
        '    match tx {',
        '        Transaction::Deposit(amount) => Ok(balance + amount),',
        '        _ => Err("TODO".to_string()),',
        '    }',
        '}',
      ].join('\n'),
      solutionCode: [
        'pub fn apply_transaction(balance: u64, tx: &Transaction) -> Result<u64, String> {',
        '    match tx {',
        '        Transaction::Deposit(amount) => Ok(balance + amount),',
        '        Transaction::Withdrawal(amount) | Transaction::Fee(amount) => {',
        '            if *amount > balance {',
        '                Err("Insufficient funds".to_string())',
        '            } else {',
        '                Ok(balance - amount)',
        '            }',
        '        }',
        '    }',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Matching withdrawal and fee', content: 'For Transaction::Withdrawal(amount), check if *amount > balance first!' },
        { level: 2, title: 'Returning Success with Ok()', content: 'In Rust, functions returning Result wrap success in Ok(...) and failures in Err(...).' },
      ],
      verificationCriteria: 'All deposit, withdrawal, and insufficient funds tests pass.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What is an enum in Rust?', options: ['A way to define a type with several distinct variants', 'A loop construct', 'A type of error'], correctAnswerIndex: 0, explanation: 'An enum defines a type that can be one of several named variants.' },
      { id: 'q2', question: 'Why must match handle all variants?', options: ['Rust requires exhaustiveness to prevent missing cases', 'It makes the code shorter', 'It is just a convention'], correctAnswerIndex: 0, explanation: 'Rust requires exhaustiveness to ensure no cases are missed, preventing runtime errors.' },
    ],
  },

  {
    id: 'option-result',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Option & Result',
    difficulty: 'Intermediate',
    estimatedMinutes: 15,
    xpReward: 50,
    overview: "Learn Rust's way of handling absence and errors without null pointers or exceptions.",
    guideContent: [
      '### Option & Result',
      '',
      "Rust doesn't have null. Instead, it uses types that explicitly encode possibility of absence or failure.",
      '',
      '### Option<T>',
      '',
      "Option<T> represents a value that might or might not be present:",
      '',
      'let some_number = Some(5);',
      'let absent_number: Option<i32> = None;',
      '',
      '### Result<T, E>',
      '',
      'Result<T, E> represents success or failure:',
      '',
      'fn divide(a: f64, b: f64) -> Result<f64, String> {',
      '    if b == 0.0 {',
      '        Err(String::from("Cannot divide by zero"))',
      '    } else {',
      '        Ok(a / b)',
      '    }',
      '}',
      '',
      '### The ? Operator',
      '',
      'Use ? to propagate errors:',
      '',
      'fn process() -> Result<(), String> {',
      '    let result = divide(10.0, 0.0)?; // Returns early if error',
      '    println!("Result: {}", result);',
      '    Ok(())',
      '}',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let opt: Option<i32> = Some(42);',
      '    match opt {',
      '        Some(n) => println!("Found: {}", n),',
      '        None => println!("Nothing found"),',
      '    }',
      '',
      '    match divide(10.0, 2.0) {',
      '        Ok(result) => println!("Result: {}", result),',
      '        Err(err) => println!("Error: {}", err),',
      '    }',
      '}',
      '',
      'fn divide(a: f64, b: f64) -> Result<f64, String> {',
      '    if b == 0.0 {',
      '        Err(String::from("Cannot divide by zero"))',
      '    } else {',
      '        Ok(a / b)',
      '    }',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 5-8', headline: 'Option Matching', explanation: 'match on Option handles both Some and None cases exhaustively.' },
      { lineRange: 'Lines 12-17', headline: 'Result Return', explanation: 'divide returns Ok(value) on success or Err(message) on failure.' },
    ],

    exercise: {
      id: 'ex-option-result',
      title: 'Exercise: Safe Division',
      description: 'Write a function that safely divides two numbers.',
      requirements: ['Create safe_divide(a: f64, b: f64) -> Result<f64, String>', 'Return Err if b is 0', 'Return Ok(a / b) otherwise', 'Test with valid and zero divisor'],
      starterCode: [
        'fn safe_divide(a: f64, b: f64) -> Result<f64, String> {',
        '    // TODO: Implement safe division',
        '}',
        '',
        'fn main() {',
        '    match safe_divide(10.0, 2.0) {',
        '        Ok(r) => println!("Result: {}", r),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '    match safe_divide(5.0, 0.0) {',
        '        Ok(r) => println!("Result: {}", r),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn safe_divide(a: f64, b: f64) -> Result<f64, String> {',
        '    if b == 0.0 {',
        '        Err(String::from("Cannot divide by zero"))',
        '    } else {',
        '        Ok(a / b)',
        '    }',
        '}',
        '',
        'fn main() {',
        '    match safe_divide(10.0, 2.0) {',
        '        Ok(r) => println!("Result: {}", r),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '    match safe_divide(5.0, 0.0) {',
        '        Ok(r) => println!("Result: {}", r),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Check for zero', content: 'Use if b == 0.0 to check for division by zero.' },
        { level: 2, title: 'Return Ok/Err', content: 'Return Err(String::from(...)) for error, Ok(a / b) for success.' },
      ],
      verificationCriteria: 'Program prints result for 10/2 and error for 5/0.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does Some(5) represent?', options: ['A value that is present', 'A value that is absent', 'An error'], correctAnswerIndex: 0, explanation: 'Some(5) represents an Option that contains the value 5.' },
      { id: 'q2', question: 'What does Err(...) represent?', options: ['Success', 'Failure with an error message', 'A warning'], correctAnswerIndex: 1, explanation: 'Err(...) represents a failed operation with an associated error message.' },
    ],
  },

  {
    id: 'error-handling',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Error Handling',
    difficulty: 'Intermediate',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: "Learn Rust's way of handling errors with Result and the ? operator.",
    guideContent: [
      '### Error Handling',
      '',
      "Rust doesn't have exceptions. Instead, it uses Result<T, E> for recoverable errors and panic! for unrecoverable ones.",
      '',
      '### The ? Operator',
      '',
      'The ? operator propagates errors automatically:',
      '',
      'fn read_username(file: &str) -> Result<String, std::io::Error> {',
      '    let content = fs::read_to_string(file)?; // Returns early if error',
      '    Ok(content.trim().to_string())',
      '}',
    ].join('\n'),

    walkthroughCode: [
      'use std::fs;',
      '',
      'fn read_config(path: &str) -> Result<String, Box<dyn std::error::Error>> {',
      '    let content = fs::read_to_string(path)?; // ? propagates errors',
      '    Ok(content.trim().to_string())',
      '}',
      '',
      'fn main() {',
      '    match read_config("config.txt") {',
      '        Ok(content) => println!("Config: {}", content),',
      '        Err(e) => println!("Error: {}", e),',
      '    }',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Line 3', headline: 'Error Propagation with ?', explanation: '? on fs::read_to_string returns the error early if reading fails, otherwise unwraps the Ok value.' },
    ],

    exercise: {
      id: 'ex-error-handling',
      title: 'Exercise: Safe File Reader',
      description: 'Create a function that reads a file and returns the first line.',
      requirements: ['Create read_first_line(path: &str) -> Result<String, String>', 'Use fs::read_to_string with ?', 'Return the first line or an error'],
      starterCode: [
        'use std::fs;',
        '',
        'fn read_first_line(path: &str) -> Result<String, String> {',
        '    // TODO: Read file and return first line',
        '}',
        '',
        'fn main() {',
        '    match read_first_line("data.txt") {',
        '        Ok(line) => println!("First line: {}", line),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '}',
      ].join('\n'),
      solutionCode: [
        'use std::fs;',
        '',
        'fn read_first_line(path: &str) -> Result<String, String> {',
        '    let content = fs::read_to_string(path)?;',
        '    let first_line = content.lines().next()',
        '        .ok_or_else(|| String::from("File is empty"))?;',
        '    Ok(first_line.to_string())',
        '}',
        '',
        'fn main() {',
        '    match read_first_line("data.txt") {',
        '        Ok(line) => println!("First line: {}", line),',
        '        Err(e) => println!("Error: {}", e),',
        '    }',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Read file with ?', content: 'Use fs::read_to_string(path)? with error propagation.' },
        { level: 2, title: 'Get first line', content: 'Use .lines().next() to get the first line.' },
      ],
      verificationCriteria: 'Program reads first line from file or returns error.',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What does ? do on a Result?', options: ['Returns the error early if it is Err', 'Ignores errors', 'Converts Err to Ok'], correctAnswerIndex: 0, explanation: '? returns the error from the function early if the Result is Err.' },
      { id: 'q2', question: 'Why use custom error types?', options: ['To provide specific error information', 'To make code run faster', 'To avoid using Result'], correctAnswerIndex: 0, explanation: 'Custom error types provide more specific and actionable error information.' },
    ],
  },

  {
    id: 'strings-collections',
    trackId: 'stage-2',
    trackTitle: '2. Understanding Rust',
    stage: 2,
    title: 'Strings & Collections',
    difficulty: 'Beginner',
    estimatedMinutes: 12,
    xpReward: 40,
    overview: 'Learn about String vs &str, Vec, HashMap, and other collections.',
    guideContent: [
      '### Strings & Collections',
      '',
      'Rust has several collection types for storing groups of values.',
      '',
      '### String vs &str',
      '',
      '- String: Owned, growable, heap-allocated text',
      '- &str: A view into existing string data (string slice)',
      '',
      '### Vec<T>',
      '',
      'A growable list of values:',
      '',
      'let mut numbers = vec![1, 2, 3];',
      'numbers.push(4);',
      '',
      '### HashMap<K, V>',
      '',
      'A key-value mapping:',
      '',
      'use std::collections::HashMap;',
      '',
      'let mut scores = HashMap::new();',
      'scores.insert(String::from("Alice"), 100);',
    ].join('\n'),

    walkthroughCode: [
      'fn main() {',
      '    let mut numbers = vec![1, 2, 3];',
      '    numbers.push(4);',
      '    println!("{:?}", numbers);',
      '',
      'let name = String::from("Rust");',
      'let slice: &str = &name;',
      'println!("{}", slice);',
      '}',
    ].join('\n'),

    walkthroughExplanations: [
      { lineRange: 'Lines 2-5', headline: 'Vec Operations', explanation: 'vec! creates a vector, push adds elements, and {:?} prints it for debugging.' },
      { lineRange: 'Lines 7-9', headline: 'String and &str', explanation: 'String is owned text, &str is a borrowed slice of that text.' },
    ],

    exercise: {
      id: 'ex-strings-collections',
      title: 'Exercise: Number Collector',
      description: 'Collect numbers into a vector and print them.',
      requirements: ['Create a vector with numbers 1 through 5', 'Push the number 6 to the vector', 'Print the vector'],
      starterCode: [
        'fn main() {',
        '    // TODO: Create a vector and add numbers',
        '    // TODO: Print the vector',
        '}',
      ].join('\n'),
      solutionCode: [
        'fn main() {',
        '    let mut numbers = vec![1, 2, 3, 4, 5];',
        '    numbers.push(6);',
        '    println!("{:?}", numbers);',
        '}',
      ].join('\n'),
      hints: [
        { level: 1, title: 'Create vector', content: 'Use vec![1, 2, 3, 4, 5] to create a vector with initial values.' },
        { level: 2, title: 'Push and print', content: 'Use numbers.push(6) to add, then println!("{:?}", numbers) to print.' },
      ],
      verificationCriteria: 'Program prints [1, 2, 3, 4, 5, 6].',
    },

    knowledgeCheck: [
      { id: 'q1', question: 'What is the difference between String and &str?', options: ['String is owned, &str is borrowed', 'String is faster, &str is slower', 'There is no difference'], correctAnswerIndex: 0, explanation: 'String owns its data and can grow; &str is a borrowed view into existing data.' },
      { id: 'q2', question: 'What does vec! do?', options: ['Creates a vector', 'Creates a string', 'Creates a hash map'], correctAnswerIndex: 0, explanation: 'vec! is a macro that creates a Vec (growable list) with the given elements.' },
    ],
  },
];

export const INITIAL_USER_PROGRESS: UserProgress = {
  totalXp: 0,
  level: 1,
  levelTitle: 'Novice Crab',
  completedLessonIds: [],
  viewedLessonIds: [],
  knowledgeCheckResults: {},
  conceptMastery: {},
  unlockedHintIndices: {},
  achievements: [],
  schemaVersion: 1,
};

/**
 * Migrates raw localStorage data into a valid UserProgress object.
 * Fills in missing fields with defaults, sanitizes wrong types,
 * and returns INITIAL_USER_PROGRESS if data is unrecoverable.
 */
export function migrateUserProgress(raw: unknown): UserProgress {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...INITIAL_USER_PROGRESS };
  }

  const data = raw as Record<string, unknown>;

  const safeArray = (value: unknown, def: string[] = []): string[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string') ? value : def;

  const safeRecord = (value: unknown, def: Record<string, unknown> = {}): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : def;

  const safeNumber = (value: unknown, def: number): number =>
    typeof value === 'number' && !isNaN(value) ? value : def;

  const safeBoolean = (value: unknown, def: boolean): boolean =>
    typeof value === 'boolean' ? value : def;

  const safeAchievements = (value: unknown): UserProgress['achievements'] => {
    if (!Array.isArray(value)) return [];
    return value.filter(
      (a): a is UserProgress['achievements'][number] =>
        a &&
        typeof a === 'object' &&
        typeof (a as Record<string, unknown>).id === 'string' &&
        typeof (a as Record<string, unknown>).title === 'string' &&
        typeof (a as Record<string, unknown>).description === 'string',
    );
  };

  const knowledgeCheckResultsRaw = safeRecord(data.knowledgeCheckResults);
  const knowledgeCheckResults: Record<string, boolean[]> = {};
  Object.keys(knowledgeCheckResultsRaw).forEach((key) => {
    const val = knowledgeCheckResultsRaw[key];
    knowledgeCheckResults[key] = Array.isArray(val) && val.every((v) => typeof v === 'boolean') ? val : [];
  });

  const conceptMasteryRaw = safeRecord(data.conceptMastery);
  const conceptMastery: Record<string, boolean> = {};
  Object.keys(conceptMasteryRaw).forEach((key) => {
    conceptMastery[key] = safeBoolean(conceptMasteryRaw[key], false);
  });

  const unlockedHintIndicesRaw = safeRecord(data.unlockedHintIndices);
  const unlockedHintIndices: Record<string, number[]> = {};
  Object.keys(unlockedHintIndicesRaw).forEach((key) => {
    const val = unlockedHintIndicesRaw[key];
    unlockedHintIndices[key] = Array.isArray(val) && val.every((v) => typeof v === 'number') ? val : [];
  });

  return {
    totalXp: safeNumber(data.totalXp, 0),
    level: safeNumber(data.level, 1),
    levelTitle: typeof data.levelTitle === 'string' ? data.levelTitle : INITIAL_USER_PROGRESS.levelTitle,
    completedLessonIds: safeArray(data.completedLessonIds),
    viewedLessonIds: safeArray(data.viewedLessonIds),
    knowledgeCheckResults,
    conceptMastery,
    unlockedHintIndices,
    achievements: safeAchievements(data.achievements),
    schemaVersion: 1,
  };
}