export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  content: string;
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface LearningPathData {
  id: string;
  title: string;
  description: string;
  icon: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  modules: CourseModule[];
  enrolled_count: number;
  rating: number;
  color: string;
  objectives: string[];
}

export const learningPathsData: LearningPathData[] = [
  {
    id: 'javascript-mastery',
    title: 'JavaScript Mastery',
    description: 'From variables to async programming — build a rock-solid foundation in the language of the web. Covers ES6+, closures, promises, and modern JavaScript patterns.',
    icon: 'javascript',
    level: 'beginner',
    duration: '8 weeks',
    enrolled_count: 2847,
    rating: 4.8,
    color: 'from-yellow-500 to-orange-500',
    objectives: [
      'Write clean, modern JavaScript using ES6+ syntax',
      'Understand closures, hoisting, and the event loop',
      'Build interactive web features with DOM manipulation',
      'Handle asynchronous code with promises and async/await',
      'Debug and optimize JavaScript for production',
    ],
    modules: [
      {
        id: 'js-fundamentals',
        title: 'JavaScript Fundamentals',
        description: 'Learn the building blocks of JavaScript — variables, data types, operators, and control flow.',
        lessons: [
          { id: 'js-variables', title: 'Variables & Data Types', description: 'var, let, const, primitives, and type coercion', duration: '45 min', content: 'JavaScript has 3 ways to declare variables: **var** (function-scoped, avoid), **let** (block-scoped, reassignable), and **const** (block-scoped, immutable binding). Primitives: number, string, boolean, null, undefined, symbol, bigint. Use `===` for strict equality to avoid type coercion bugs.' },
          { id: 'js-operators', title: 'Operators & Expressions', description: 'Arithmetic, comparison, logical, and ternary operators', duration: '35 min', content: 'JavaScript operators: arithmetic (`+`, `-`, `*`, `/`, `%`, `**`), comparison (`===`, `!==`, `>`, `<`), logical (`&&`, `||`, `!`, `??`), and ternary (`condition ? a : b`). Prefer strict equality. `??` only checks null/undefined, not all falsy values.' },
          { id: 'js-control-flow', title: 'Control Flow', description: 'if/else, switch, loops, and error handling with try/catch', duration: '40 min', content: 'Control flow directs code execution. Use `if/else if/else` for conditions, `switch` for multiple discrete values, `for`/`while`/`for...of`/`for...in` for iteration. Always handle errors with `try/catch/finally`. Never leave catch blocks empty.' },
          { id: 'js-functions-basics', title: 'Functions Basics', description: 'Function declarations, expressions, arrow functions, and parameters', duration: '50 min', content: 'Functions are reusable blocks. Declarations are hoisted; expressions are not. Arrow functions (`() => {}`) don\'t have their own `this`. Use default parameters (`function f(x = 5)`) and rest parameters (`...args`) for flexible APIs.' },
        ],
      },
      {
        id: 'js-scope-closures',
        title: 'Functions & Scope',
        description: 'Deep dive into execution context, scope chains, closures, and the this keyword.',
        lessons: [
          { id: 'js-scope', title: 'Scope & Hoisting', description: 'Global, function, and block scope; hoisting behavior', duration: '40 min', content: 'Scope determines variable visibility. **Global** (accessible everywhere), **function** (`var` inside function), **block** (`let`/`const` inside `{}`). Hoisting moves declarations to top — `var` is hoisted with `undefined`, `let`/`const` are hoisted but uninitialized (Temporal Dead Zone).' },
          { id: 'js-closures', title: 'Closures', description: 'Lexical scoping, closure patterns, and practical use cases', duration: '55 min', content: 'A **closure** is a function that remembers its lexical scope even when called outside it. Used for data privacy (private variables), function factories, and callbacks. Created every time a function is defined. In loops, use `let` to create a new binding per iteration.' },
          { id: 'js-this', title: 'The `this` Keyword', description: 'Binding rules, call/apply/bind, and arrow function context', duration: '45 min', content: '`this` refers to the execution context. 4 rules: **default** (global), **implicit** (method call), **explicit** (`call`/`apply`/`bind`), **arrow** (inherits from enclosing scope). `this` is determined by HOW a function is called, not where defined.' },
        ],
      },
      {
        id: 'js-objects-arrays',
        title: 'Objects & Arrays',
        description: 'Master data manipulation with objects, arrays, destructuring, and spread syntax.',
        lessons: [
          { id: 'js-objects', title: 'Objects Deep Dive', description: 'Property descriptors, getters/setters, and object methods', duration: '40 min', content: 'Objects are key-value collections. Access with dot or bracket notation. **Property descriptors** control writable/enumerable/configurable. Methods: `Object.keys()`, `Object.values()`, `Object.entries()`, `Object.freeze()` (shallow). Use spread `{...obj}` to clone.' },
          { id: 'js-arrays', title: 'Array Methods', description: 'map, filter, reduce, find, sort, and chaining patterns', duration: '55 min', content: 'Core array methods: `map` (transform), `filter` (keep matching), `reduce` (accumulate), `find` (first match), `some`/`every` (test). Chain them for clean data pipelines: `arr.filter(f1).map(f2).reduce(f3)`. Prefer these over `for` loops for data transformations.' },
          { id: 'js-destructuring', title: 'Destructuring & Spread', description: 'Array and object destructuring, rest/spread patterns', duration: '35 min', content: 'Destructuring unpacks values: `const { name, age } = obj` or `const [first, second] = arr`. Rename with `{ name: userName }`. Rest (`...rest`) collects remaining; spread (`...arr`) expands. Default values: `{ city = "NYC" }`.' },
        ],
      },
      {
        id: 'js-dom',
        title: 'DOM Manipulation',
        description: 'Interact with the browser — select elements, handle events, and update the page.',
        lessons: [
          { id: 'js-dom-selectors', title: 'DOM Selectors & Traversal', description: 'querySelector, closest, parent/child traversal', duration: '40 min', content: 'Select elements with `document.querySelector()` (first match) or `querySelectorAll()` (NodeList). Traverse: `parentElement`, `children`, `closest(selector)`, `nextElementSibling`, `previousElementSibling`. Prefer `Element` variants to skip text nodes.' },
          { id: 'js-dom-events', title: 'Events & Delegation', description: 'Event listeners, propagation, delegation, and custom events', duration: '50 min', content: 'Events follow 3 phases: capture → target → bubble. Use `addEventListener(type, handler)`. **Event delegation** attaches ONE listener to a parent to handle multiple children. Use `e.stopPropagation()` to stop bubbling, `e.preventDefault()` to cancel defaults.' },
          { id: 'js-dom-manipulation', title: 'Modifying the DOM', description: 'Creating, inserting, and removing elements; classList and styling', duration: '40 min', content: 'Create: `document.createElement()`. Insert: `appendChild()`, `append()`, `prepend()`, `insertAdjacentHTML()`. Remove: `element.remove()`. Style: `classList.add/remove/toggle/contains`. Use `textContent` over `innerHTML` for security.' },
        ],
      },
      {
        id: 'js-modern',
        title: 'Modern JavaScript',
        description: 'ES6+ features, modules, promises, async/await, and modern tooling.',
        lessons: [
          { id: 'js-es6', title: 'ES6+ Features', description: 'Template literals, symbols, maps, sets, and optional chaining', duration: '50 min', content: 'ES6+ features: **template literals** (`` `Hello ${name}` ``), **Maps** (key-value with any key type), **Sets** (unique values), **optional chaining** (`user?.address?.city`), **nullish coalescing** (`a ?? b` — only null/undefined). ES2025+ adds **Object.groupBy** (replaces reduce for grouping), **Map.getOrInsert** (single-lookup upsert), **Set.union/intersection/difference** (native set ops). ES2026 ships the **Temporal API** (immutable Date replacement: `Temporal.Now.plainDateISO()`) and **Iterator helpers** (`.map()`, `.filter()`, `.take()` for lazy iteration).' },
          { id: 'js-promises', title: 'Promises & Async/Await', description: 'Promise chaining, error handling, Promise.all, and async/await', duration: '55 min', content: '**Promises** represent future values: `new Promise((resolve, reject) => {})`. Chain with `.then().catch().finally()`. Combinators: `Promise.all()` (all settle), `Promise.race()` (first settles), `Promise.allSettled()` (all, no reject). **Async/await** is syntactic sugar: `async function f() { await promise; }`. ES2025 adds **Promise.withResolvers** — returns `{ promise, resolve, reject }` outside the constructor, useful for callback-based APIs. **Array.fromAsync** (ES2026) creates arrays from async iterables.' },
          { id: 'js-modules', title: 'Modules & Tooling', description: 'Import/export, bundlers, and modern workflow', duration: '45 min', content: 'ES modules: `export` / `import`. Named exports enable tree-shaking. Default exports: `export default`. Dynamic imports: `import("./module.js")` for code splitting. Modern tools: Vite (fast dev/build), esbuild (bundler), Babel (transpilation). **2026 best practices**: minimize dependencies ruthlessly — native JS now replaces many npm packages. Use Socket.dev to audit supply chain security. Stop using CommonJS for new projects; ES modules are the standard.' },
        ],
      },
    ],
  },
  {
    id: 'react-development',
    title: 'React Development',
    description: 'Build modern UIs with React — components, hooks, state management, routing, and performance optimization.',
    icon: 'react',
    level: 'intermediate',
    duration: '10 weeks',
    enrolled_count: 2156,
    rating: 4.7,
    color: 'from-cyan-500 to-blue-500',
    objectives: [
      'Build reusable component architectures',
      'Manage state effectively with hooks and context',
      'Implement routing and data fetching patterns',
      'Optimize performance with memoization and lazy loading',
      'Test and deploy React applications to production',
    ],
    modules: [
      {
        id: 'react-fundamentals',
        title: 'React Fundamentals',
        description: 'JSX, components, props, and the component lifecycle.',
        lessons: [
          { id: 'react-jsx', title: 'JSX & Rendering', description: 'JSX syntax, expressions, conditional rendering, and fragments', duration: '40 min', content: 'JSX = JavaScript XML, compiles to `React.createElement()`. Rules: single root (use `<>...</>` Fragment), `className` instead of `class`, self-closing tags. Conditionals: ternary `{cond ? <A /> : <B />}`, `&&` for optional, IIFE for complex. Lists need unique `key` props.' },
          { id: 'react-components', title: 'Components & Props', description: 'Functional components, props, defaultProps, and children', duration: '45 min', content: 'Components = reusable UI building blocks. Props are READ-ONLY. Use TypeScript interfaces for type safety. `children` prop for composition. Spread props: `{...props}`. Never mutate props — treat them as immutable inputs.' },
          { id: 'react-lifecycle', title: 'Component Lifecycle', description: 'Mounting, updating, unmounting phases in class and function components', duration: '50 min', content: '3 phases: **mount** (useEffect with `[]`), **update** (useEffect with deps), **unmount** (cleanup function). `useEffect` replaces `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`. Always clean up subscriptions/timers.' },
        ],
      },
      {
        id: 'react-hooks',
        title: 'State & Hooks',
        description: 'useState, useEffect, useRef, and custom hooks for reusable logic.',
        lessons: [
          { id: 'react-usestate', title: 'useState & State Management', description: 'State initialization, updater functions, and derived state', duration: '45 min', content: '`useState(initial)` returns `[value, setValue]`. Use **updater function**: `setCount(prev => prev + 1)` when new state depends on old. **Derived state**: compute from existing state, don\'t store separately. **Lazy init**: `useState(() => expensiveComputation())`. React 19\'s **useActionState** replaces manual loading/error state for form mutations with a single hook. Prefer `useActionState` over useState+useEffect for async form submissions.' },
          { id: 'react-useeffect', title: 'useEffect & Side Effects', description: 'Effect dependencies, cleanup, and common patterns', duration: '55 min', content: '`useEffect` handles side effects (API calls, subscriptions, DOM). Dependencies control when it re-runs: `[]` = mount only, `[dep]` = when dep changes, no array = every render. Always return cleanup. Use `cancelled` flag pattern for async to prevent updates on unmounted components. **React 19 tip**: for data fetching, prefer the new `use()` hook with `<Suspense>` — it eliminates useEffect boilerplate for async resources entirely.' },
          { id: 'react-custom-hooks', title: 'Custom Hooks', description: 'Extracting logic into reusable hooks and hook composition', duration: '50 min', content: 'Custom hooks extract reusable logic. Must start with `use`. Can call other hooks (composition). Return useful values/objects. Example: `useWindowSize()`, `useFetch(url)`. Encapsulate complex state logic and side effects for reuse across components. **React 19**: `use()` is a new built-in hook that breaks the old rules — it can be called conditionally and inside loops. It consumes Promises (with Suspense) or Context values directly without useEffect or useContext.' },
        ],
      },
      {
        id: 'react-advanced',
        title: 'Advanced Patterns',
        description: 'Context, reducers, render props, and compound components.',
        lessons: [
          { id: 'react-context', title: 'Context API', description: 'Creating context, providers, consumers, and useContext', duration: '45 min', content: 'Context provides dependency injection for React. `createContext(default)` → Provider wraps subtree → `useContext()` consumes. Avoid overuse — split large contexts. Context triggers re-render on ALL consumers when value changes. Use separate contexts for unrelated state. **React 19**: the `use()` hook can also read context (`use(ThemeContext)`) and works conditionally — unlike `useContext` which must be called at the top level.' },
          { id: 'react-reducers', title: 'useReducer & State Machines', description: 'Reducer patterns, dispatch, and complex state logic', duration: '50 min', content: '`useReducer(reducer, initialState)` for complex state. Reducer is a pure function `(state, action) => newState`. Actions are objects with `type` and optional `payload`. Use TypeScript discriminated unions for type safety. Great for state machines and multi-value state.' },
          { id: 'react-patterns', title: 'Advanced Component Patterns', description: 'Render props, HOCs, compound components, and slots', duration: '55 min', content: '**Compound components** share implicit state via Context (e.g., `<Select><Select.Option>`). **Slots** accept `ReactNode` props for flexible layouts. **Render props**: function child provides data. Patterns should simplify the API, not complicate it.' },
        ],
      },
      {
        id: 'react-routing',
        title: 'Routing & Data Fetching',
        description: 'React Router, data fetching strategies, and error boundaries.',
        lessons: [
          { id: 'react-router', title: 'React Router', description: 'Routes, nested routes, params, navigation, and guards', duration: '50 min', content: 'React Router enables client-side navigation. Use `<BrowserRouter>` → `<Routes>` → `<Route path="" element={}>`. Dynamic segments: `:id` → `useParams()`. Navigation: `useNavigate()`. Guards: wrap routes with `<ProtectedRoute>` checking auth state. React 19\'s **Actions API** integrates seamlessly with forms — use `action={handleSubmit}` on `<form>` for progressive enhancement with built-in pending/error states.' },
          { id: 'react-data-fetching', title: 'Data Fetching Strategies', description: 'Fetch API, SWR/React Query patterns, loading states, and caching', duration: '55 min', content: 'Always handle loading, error, and success states. Cancel in-flight requests on unmount (cancelled flag). **Optimistic updates** update UI immediately, then sync with server, rollback on error. Use React 19\'s **useOptimistic** hook: `const [optimisticState, addOptimistic] = useOptimistic(state, (current, value) => newState)`. Libraries: React Query, SWR. The `use()` hook can consume promises directly inside `<Suspense>` — no more manual state for async.' },
          { id: 'react-errors', title: 'Error Boundaries & Suspense', description: 'Error boundaries, Suspense, and fallback UI patterns', duration: '40 min', content: '**Error boundaries** catch render errors — still class components. Use `React.lazy()` + `<Suspense>` for code splitting. Error boundaries don\'t catch event handlers (use try/catch there). Fallback UI improves user experience on errors.' },
        ],
      },
      {
        id: 'react-performance',
        title: 'Performance & Production',
        description: 'Memoization, code splitting, testing, and deployment.',
        lessons: [
          { id: 'react-memo', title: 'Performance Optimization', description: 'React.memo, useMemo, useCallback, and profiling', duration: '50 min', content: '**React.memo** prevents re-render if props haven\'t changed (shallow compare). **useMemo** caches computed values: `useMemo(() => expensive(a, b), [a, b])`. **useCallback** caches function references. Use React DevTools Profiler to identify re-render bottlenecks. **React 19 Compiler** automatically memoizes components — remove manual `React.memo`, `useMemo`, and `useCallback` where the compiler can optimize. Keep components small for best compiler results. Avoid premature optimization.' },
          { id: 'react-testing', title: 'Testing React Apps', description: 'Jest, React Testing Library, and component tests', duration: '55 min', content: '**React Testing Library** tests behavior, not implementation. Render components with `render()`, query elements by accessibility role/text. Use `fireEvent` or `userEvent` for interactions. Avoid testing internal state — test user-visible behavior. Mock HTTP with MSW. **2026**: Vitest has largely replaced Jest for Vite-based projects. Playwright is preferred for E2E over Cypress. Use `@testing-library/react` with vitest for fast, modern test suites.' },
          { id: 'react-deploy', title: 'Build & Deploy', description: 'Code splitting, lazy loading, and deployment to Vercel', duration: '45 min', content: '**Code splitting** with `React.lazy()` + `Suspense`. Analyze bundle with `vite-bundle-visualizer`. Optimize assets, use CDN for static files. Set up CI/CD with GitHub Actions: lint → test → build → deploy. Environment variables for API keys. **2026**: Vite is the standard build tool. React 19\'s `preload()` and `preinit()` APIs optimize asset loading declaratively. Use Docker + container registries for reproducible deployments.' },
        ],
      },
    ],
  },
  {
    id: 'database-sql',
    title: 'Database & SQL',
    description: 'Design relational databases, write efficient SQL queries, and work with PostgreSQL features like JSON, full-text search, and extensions.',
    icon: 'database',
    level: 'intermediate',
    duration: '6 weeks',
    enrolled_count: 1634,
    rating: 4.6,
    color: 'from-blue-500 to-indigo-500',
    objectives: [
      'Design normalized relational database schemas',
      'Write complex SQL queries with JOINs and aggregations',
      'Optimize query performance with indexes',
      'Use PostgreSQL-specific features effectively',
      'Integrate databases with application code',
    ],
    modules: [
      {
        id: 'db-design',
        title: 'Relational Database Design',
        description: 'Tables, relationships, normalization, and entity-relationship modeling.',
        lessons: [
          { id: 'db-erm', title: 'Entity-Relationship Modeling', description: 'Entities, attributes, relationships, and ER diagrams', duration: '45 min', content: '**Entities** are real-world objects (User, Order). **Attributes** describe them. **Relationships** connect entities (1:1, 1:N, M:N). ER diagrams visually represent schemas. Always identify primary keys. For M:N, create a junction table. Use tools like dbdiagram.io for diagramming. **2026 best practice**: prefer UUID v7 over auto-increment IDs for distributed systems — PostgreSQL 18 adds `uuidv7()` which is timestamp-ordered, reducing index fragmentation vs UUID v4.' },
          { id: 'db-normalization', title: 'Normalization', description: '1NF, 2NF, 3NF, and denormalization trade-offs', duration: '50 min', content: 'Normalization eliminates redundancy: **1NF** (atomic columns), **2NF** (no partial dependencies), **3NF** (no transitive dependencies). Higher normal forms exist (BCNF, 4NF) but 3NF suffices for most apps. Denormalization trades storage for read performance.' },
          { id: 'db-constraints', title: 'Constraints & Relationships', description: 'Primary keys, foreign keys, unique constraints, and cascades', duration: '40 min', content: 'Constraints enforce data integrity. **PRIMARY KEY** = unique + not null. **FOREIGN KEY** links tables. **UNIQUE** prevents duplicates. **CASCADE** options: RESTRICT, CASCADE, SET NULL. Use `ON DELETE CASCADE` carefully — prefer RESTRICT and handle deletion in app code.' },
        ],
      },
      {
        id: 'db-sql-basics',
        title: 'SQL Fundamentals',
        description: 'SELECT, INSERT, UPDATE, DELETE, filtering, and sorting.',
        lessons: [
          { id: 'db-select', title: 'SELECT & Filtering', description: 'WHERE, LIKE, IN, BETWEEN, and pattern matching', duration: '45 min', content: '`SELECT col1, col2 FROM table WHERE condition`. Filter with `WHERE`, `AND`/`OR`, `IN`, `BETWEEN`, `LIKE` (pattern matching: `%` wildcard). `LIKE` is case-insensitive in PostgreSQL by default. `ILIKE` is explicit case-insensitive. Use `LIMIT` and `OFFSET` for pagination.' },
          { id: 'db-insert-update', title: 'INSERT, UPDATE & DELETE', description: 'CRUD operations, transactions, and batch operations', duration: '40 min', content: '`INSERT INTO table (cols) VALUES (vals) RETURNING *`. `UPDATE table SET col = val WHERE condition`. `DELETE FROM table WHERE condition`. Always use transactions for multi-step writes: `BEGIN; ... COMMIT;` or `ROLLBACK;`. Use `RETURNING` to get modified rows.' },
          { id: 'db-aggregation', title: 'Aggregation & Grouping', description: 'COUNT, SUM, AVG, GROUP BY, HAVING, and window functions', duration: '55 min', content: 'Aggregate functions: `COUNT`, `SUM`, `AVG`, `MIN`, `MAX`. `GROUP BY` splits rows into groups. `HAVING` filters groups (like WHERE for groups). **Window functions**: `ROW_NUMBER()`, `RANK()`, `SUM() OVER (PARTITION BY ...)` — compute across related rows without collapsing.' },
        ],
      },
      {
        id: 'db-advanced-queries',
        title: 'Advanced Queries',
        description: 'JOINs, subqueries, CTEs, and set operations.',
        lessons: [
          { id: 'db-joins', title: 'JOINs Deep Dive', description: 'INNER, LEFT, RIGHT, FULL, CROSS JOINs and join conditions', duration: '50 min', content: '`INNER JOIN` = matching rows only. `LEFT JOIN` = all left + matching right (NULL for missing). `RIGHT JOIN` = all right + matching left. `FULL JOIN` = all rows from both. `CROSS JOIN` = cartesian product. Always qualify columns with table aliases: `FROM users u JOIN orders o ON u.id = o.user_id`.' },
          { id: 'db-subqueries', title: 'Subqueries & CTEs', description: 'Correlated subqueries, common table expressions, and recursive CTEs', duration: '55 min', content: '**Subqueries** in WHERE/SELECT/FROM. **Correlated subqueries** reference outer query (run per row — potentially slow). **CTEs** (WITH clauses) improve readability: `WITH cte AS (SELECT ...) SELECT * FROM cte`. **Recursive CTEs** traverse hierarchies (org charts, categories).' },
          { id: 'db-set-operations', title: 'Set Operations', description: 'UNION, INTERSECT, EXCEPT, and their use cases', duration: '35 min', content: 'Set operations combine result sets: `UNION ALL` (keeps duplicates), `UNION` (deduplicates), `INTERSECT` (common rows), `EXCEPT` (rows in first but not second). Columns must match in number and type. These are cleaner than complex OR conditions for some queries.' },
        ],
      },
      {
        id: 'db-performance',
        title: 'Indexing & Performance',
        description: 'Query planning, indexes, and optimization strategies.',
        lessons: [
          { id: 'db-indexes', title: 'Indexes', description: 'B-tree, hash, and partial indexes; index scan vs sequential scan', duration: '50 min', content: 'Indexes speed up reads at cost of slower writes. **B-tree** (default, good for comparisons/ordering), **Hash** (equality only), **GIN** (full-text, JSONB), **GiST** (geospatial). **Partial indexes** on subsets: `CREATE INDEX ON users (email) WHERE active = true`. Use `EXPLAIN ANALYZE` to check index usage. PostgreSQL 18 adds **B-Tree Skip Scan** — uses multicolumn indexes more efficiently when leading columns have few distinct values. Also index foreign keys — 99% of apps forget this.' },
          { id: 'db-query-planning', title: 'Query Planning & EXPLAIN', description: 'Reading EXPLAIN output, identifying slow queries, and optimization', duration: '45 min', content: '`EXPLAIN ANALYZE` shows actual execution plan. Look for: sequential scans on large tables (add index), nested loops when hash join would be better, high row count estimates. Common fixes: composite indexes, covering indexes, rewriting queries to use early filters.' },
        ],
      },
      {
        id: 'db-postgresql',
        title: 'PostgreSQL Features',
        description: 'JSON, full-text search, extensions, and advanced data types.',
        lessons: [
          { id: 'db-json', title: 'JSON & JSONB', description: 'Storing, querying, and indexing JSON data in PostgreSQL', duration: '45 min', content: 'Two JSON types: `JSON` (stores exact text), `JSONB` (binary, indexed, no key order). Query with `->` (returns JSON) and `->>` (returns text): `data->>\'name\'`. Index JSONB with GIN: `CREATE INDEX ON table USING GIN (data)`. Use `@>` for containment checks. **2026 tip**: JSONB for flexible attributes that vary per user or integration data, but never for core relational data. PostgreSQL 18 adds **virtual generated columns** (computed on read, no storage cost) — use for derived JSONB extracts.' },
          { id: 'db-fulltext', title: 'Full-Text Search', description: 'tsvector, tsquery, indexes, and ranking', duration: '50 min', content: 'Full-text search uses **tsvector** (tokenized document) and **tsquery** (search query). `to_tsvector(\'english\', body) @@ to_tsquery(\'cat & dog\')`. Rank with `ts_rank()`. Index with GIN on tsvector. Use `websearch_to_tsquery()` for simpler search syntax. **2026**: For AI-powered search, use **pgvector** extension with embedding similarity search (`<=>` operator) — combines SQL + vector search in one database, eliminating a separate vector DB.' },
          { id: 'db-extensions', title: 'Extensions & Advanced Types', description: 'PostGIS, UUID, arrays, range types, and custom extensions', duration: '40 min', content: 'Enable with `CREATE EXTENSION`. Popular: **PostGIS** (geospatial), **pgcrypto** (PGP encryption), **uuid-ossp** (UUID gen), **ltree** (hierarchical labels). Array types: `TEXT[]`, `INT[]`. Range types: `daterange`, `int4range`. Use `GENERATED AS IDENTITY` instead of `SERIAL` for primary keys. **pgvector** is the must-know extension for 2026 — store and query AI embeddings with vector similarity search directly in PostgreSQL. **pg_cron** schedules DB jobs. PostgreSQL 18 improves logical replication with DDL propagation and adds OAuth authentication support.' },
        ],
      },
    ],
  },
  {
    id: 'machine-learning',
    title: 'Machine Learning',
    description: 'From data preprocessing to neural networks — understand ML algorithms, build models, and deploy them to production.',
    icon: 'ml',
    level: 'advanced',
    duration: '12 weeks',
    enrolled_count: 982,
    rating: 4.9,
    color: 'from-purple-500 to-pink-500',
    objectives: [
      'Understand supervised and unsupervised learning paradigms',
      'Preprocess and prepare data for ML models',
      'Implement core ML algorithms from scratch',
      'Build and train neural networks with deep learning frameworks',
      'Deploy and monitor ML models in production',
    ],
    modules: [
      {
        id: 'ml-fundamentals',
        title: 'ML Fundamentals',
        description: 'Core concepts, terminology, and the ML workflow.',
        lessons: [
          { id: 'ml-intro', title: 'What is Machine Learning?', description: 'Supervised vs unsupervised, training vs inference, and the ML pipeline', duration: '45 min', content: 'ML = computers learning patterns from data without explicit rules. **Supervised**: labeled data (regression, classification). **Unsupervised**: no labels (clustering, dimensionality reduction). **Pipeline**: data collection → preprocessing → train → evaluate → deploy → monitor. Training = learning parameters. Inference = making predictions. **2026 trends**: **Agentic AI** (autonomous systems that plan and execute) dominates the landscape. LLMOps (prompt engineering, RAG pipelines, token cost tracking) is the fastest-growing ML subfield.' },
          { id: 'ml-terminology', title: 'Key Terminology', description: 'Features, labels, overfitting, underfitting, bias-variance tradeoff', duration: '40 min', content: '**Features** = input variables. **Labels** = target output. **Overfitting** = memorizes training data, fails on new data (high variance). **Underfitting** = fails to learn patterns (high bias). **Bias-variance tradeoff**: simple models underfit, complex models overfit. Use cross-validation to find the sweet spot.' },
          { id: 'ml-evaluation', title: 'Model Evaluation', description: 'Train/test split, cross-validation, confusion matrices, and metrics', duration: '55 min', content: 'Split: train (60-80%), validation (10-20%), test (10-20%). **Cross-validation**: k-fold splits data into k folds, trains k times. **Classification metrics**: accuracy, precision, recall, F1, ROC-AUC. **Regression metrics**: MSE, MAE, R-squared. Choose metrics based on business goals.' },
        ],
      },
      {
        id: 'ml-data-prep',
        title: 'Data Preparation',
        description: 'Cleaning, preprocessing, feature engineering, and data augmentation.',
        lessons: [
          { id: 'ml-cleaning', title: 'Data Cleaning', description: 'Handling missing values, outliers, and data quality issues', duration: '50 min', content: 'Real data is messy. Handle **missing values**: drop rows, impute (mean/median/mode), or predict. Detect **outliers** with IQR or z-score. Check data types, duplicate rows, inconsistent formatting. Always visualize distributions before/after cleaning. Garbage in = garbage out.' },
          { id: 'ml-features', title: 'Feature Engineering', description: 'Encoding, scaling, normalization, and feature selection', duration: '55 min', content: '**Encoding**: one-hot (nominal), label/ordinal (ordinal), target encoding. **Scaling**: StandardScaler (z-score), MinMaxScaler (0-1), RobustScaler (median/IQR). **Feature selection**: correlation analysis, mutual information, feature importance from tree models. Reduce dimensionality with PCA.' },
          { id: 'ml-augmentation', title: 'Data Augmentation', description: 'Synthetic data, sampling strategies, and class imbalance', duration: '40 min', content: '**Class imbalance**: resample (SMOTE for oversampling, random undersampling), use class weights, choose metrics like F1/ROC-AUC. **Data augmentation** generates synthetic variants (image flips/rotations, text back-translation). Use stratified splits to maintain class distribution.' },
        ],
      },
      {
        id: 'ml-algorithms',
        title: 'Core Algorithms',
        description: 'Regression, classification, clustering, and ensemble methods.',
        lessons: [
          { id: 'ml-regression', title: 'Linear & Logistic Regression', description: 'Gradient descent, cost functions, and regularization', duration: '55 min', content: '**Linear regression**: predicts continuous values. Minimizes MSE via gradient descent. **Logistic regression**: predicts probabilities via sigmoid function. **Regularization**: L1 (Lasso, sparse), L2 (Ridge, shrink). Use learning rate scheduling for gradient descent convergence.' },
          { id: 'ml-classification', title: 'Classification Algorithms', description: 'Decision trees, random forests, SVM, and k-nearest neighbors', duration: '60 min', content: '**Decision trees**: recursive splits, interpretable, prone to overfitting. **Random forests**: ensemble of trees reduces variance. **SVM**: finds max-margin hyperplane, works well with RBF kernel. **k-NN**: lazy learner, distance-based. No free lunch — try multiple algorithms and compare.' },
          { id: 'ml-clustering', title: 'Clustering', description: 'K-means, hierarchical clustering, DBSCAN, and dimensionality reduction', duration: '50 min', content: '**K-means**: partitions into k clusters, sensitive to initialization (use k-means++). **Hierarchical**: agglomerative (bottom-up) builds dendrogram. **DBSCAN**: density-based, finds arbitrary shapes, handles outliers. **PCA**: linear dimensionality reduction, preserves variance. **t-SNE**: visualization, non-linear.' },
        ],
      },
      {
        id: 'ml-neural',
        title: 'Neural Networks',
        description: 'Perceptrons, backpropagation, CNNs, RNNs, and transformers.',
        lessons: [
          { id: 'ml-perceptron', title: 'Perceptron & Backpropagation', description: 'Single neuron, activation functions, and gradient backpropagation', duration: '55 min', content: '**Perceptron**: weighted sum + activation. **Activation functions**: ReLU (hidden), sigmoid/tanh (classification), softmax (multi-class). **Backpropagation**: chain rule computes gradients layer-by-layer. **Learning rate**: too high = overshoot, too low = slow. Use Adam optimizer as default.' },
          { id: 'ml-cnn', title: 'Convolutional Neural Networks', description: 'Convolutions, pooling, and architectures like ResNet', duration: '60 min', content: 'CNNs exploit spatial structure. **Convolution** layers learn filters to detect features (edges, textures). **Pooling** (max/avg) reduces spatial dimensions. **Architectures**: ResNet (skip connections), VGG (deep stacks), EfficientNet (compound scaling). Data augmentation critical for image tasks.' },
          { id: 'ml-transformers', title: 'Transformers & Attention', description: 'Self-attention, transformer architecture, and BERT/GPT foundations', duration: '65 min', content: '**Self-attention**: each token attends to all others. Q (query), K (key), V (value) matrices. **Multi-head attention**: multiple parallel attention heads. **Transformer**: encoder (BERT) + decoder (GPT). Positional encoding preserves order. Pre-train on large data, fine-tune on specific tasks. By 2026, transformers power virtually all NLP and most computer vision tasks. **Agentic AI** (autonomous LLM agents that plan and use tools) is the hottest area — built entirely on transformer architectures with chain-of-thought reasoning.' },
        ],
      },
      {
        id: 'ml-mlops',
        title: 'Model Deployment & MLOps',
        description: 'Training pipelines, model serving, monitoring, and A/B testing.',
        lessons: [
          { id: 'ml-pipelines', title: 'ML Pipelines', description: 'Automated training pipelines, feature stores, and experiment tracking', duration: '50 min', content: '**ML pipelines** automate: data validation → feature engineering → train → evaluate → deploy. **Feature stores** (Feast, Tecton) centralize features for reuse and consistency. **Experiment tracking** (MLflow, Weights & Biases): log params, metrics, artifacts. Version both data and models. **2026**: MLOps market is $1.7B growing at 40% CAGR to $39B+ by 2034. LLMOps adds prompt tracking, RAG pipeline orchestration, and token cost monitoring to traditional MLOps.' },
          { id: 'ml-serving', title: 'Model Serving', description: 'REST APIs, batch inference, and edge deployment strategies', duration: '55 min', content: '**Real-time**: wrap model in REST API (FastAPI, Flask), package in Docker, deploy to Kubernetes. **Batch**: scheduled jobs process large datasets (Spark, Arrow). **Edge**: optimize with ONNX/TensorRT, deploy to mobile/IoT. **Monitoring**: latency, throughput, prediction drift.' },
          { id: 'ml-monitoring', title: 'Monitoring & Maintenance', description: 'Drift detection, retraining strategies, and A/B testing', duration: '45 min', content: '**Data drift**: input distribution changes. **Concept drift**: relationship between features and target changes. Detect with statistical tests (KS, PSI). **Retrain**: scheduled (weekly) or triggered (drift detected). **A/B testing**: compare model versions in production. Roll back if metrics degrade. **LLMOps**: new monitoring dimensions — prompt quality, token usage costs, latency, output toxicity, and hallucination rate. Tools like LangSmith and Weights & Biases track LLM-specific metrics.' },
        ],
      },
    ],
  },
  {
    id: 'data-structures-algorithms',
    title: 'Data Structures & Algorithms',
    description: 'Master the fundamentals of computer science — arrays, trees, graphs, sorting, and dynamic programming. Essential for technical interviews.',
    icon: 'datastructures',
    level: 'advanced',
    duration: '10 weeks',
    enrolled_count: 1456,
    rating: 4.8,
    color: 'from-emerald-500 to-teal-500',
    objectives: [
      'Implement fundamental data structures from scratch',
      'Analyze time and space complexity using Big O notation',
      'Solve complex problems with recursion and dynamic programming',
      'Navigate graph algorithms like BFS, DFS, and shortest path',
      'Excel in technical coding interviews',
    ],
    modules: [
      {
        id: 'dsa-arrays',
        title: 'Arrays & Strings',
        description: 'Array manipulation, two-pointer technique, sliding window, and string algorithms.',
        lessons: [
          { id: 'dsa-array-basics', title: 'Array Fundamentals', description: 'Dynamic arrays, rotations, and in-place operations', duration: '45 min', content: 'Arrays store elements contiguously in memory. **Dynamic arrays** (e.g., Python list, JS Array) double capacity when full — O(1) amortized append. **In-place** operations modify without extra space (swap, reverse). Rotations: use reversal algorithm or modular arithmetic. Complexity: access O(1), search O(n). **Interview tip**: arrays are the most-tested data structure. Master patterns, not individual problems. Practice with time constraints to simulate real interviews.' },
          { id: 'dsa-two-pointer', title: 'Two Pointer Technique', description: 'Pair sums, triplets, and partition problems', duration: '50 min', content: 'Two pointers iterate from opposite ends (or same direction at different speeds). Common patterns: **left+right** (sorted pair sum), **fast+slow** (cycle detection), **sliding window** variations. Saves O(n²) from naive nested loops. Always check if input must be sorted first.' },
          { id: 'dsa-sliding-window', title: 'Sliding Window', description: 'Fixed and variable window problems, substring search', duration: '55 min', content: 'Sliding window maintains a subarray/substring range. **Fixed**: window of size k slides across (max sum subarray). **Variable**: expand/shrink window dynamically (longest substring without repeating chars). Template: expand right, shrink left while condition violated, update result.' },
        ],
      },
      {
        id: 'dsa-linked-lists',
        title: 'Linked Lists & Trees',
        description: 'Singly/doubly linked lists, binary trees, traversal, and balancing.',
        lessons: [
          { id: 'dsa-linked-list', title: 'Linked Lists', description: 'Singly, doubly, and circular linked lists; reversal and merge', duration: '50 min', content: 'Linked lists: nodes with data + pointer(s) to next/prev. **Singly**: one direction, O(n) access. **Doubly**: prev + next pointers, O(1) delete of known node. **Circular**: tail points to head. Key operations: reverse (iterative with 3 pointers or recursive), merge two sorted lists, detect cycle (Floyd\'s algorithm).' },
          { id: 'dsa-trees', title: 'Binary Trees & BSTs', description: 'Tree traversals, BST operations, and balancing (AVL)', duration: '55 min', content: '**Binary Tree**: each node has 0-2 children. **BST**: left < node < right. Operations (search/insert/delete): O(h) where h = height. **AVL trees**: self-balancing via rotations (LL, RR, LR, RL). In-order traversal of BST yields sorted order. Level-order = BFS.' },
          { id: 'dsa-tree-traversal', title: 'Tree Traversal Algorithms', description: 'DFS (inorder, preorder, postorder) and BFS (level order)', duration: '45 min', content: '**DFS**: recursive (clean) or iterative with stack. Inorder (left-root-right) for BST sorted order. Preorder (root-left-right) for tree copy. Postorder (left-right-root) for deletion. **BFS**: level-order with queue. Use recursion for short trees, iteration for deep trees (avoid stack overflow).' },
        ],
      },
      {
        id: 'dsa-hash-graphs',
        title: 'Hash Tables & Graphs',
        description: 'Hashing strategies, graph representations, BFS, DFS, and shortest paths.',
        lessons: [
          { id: 'dsa-hashing', title: 'Hash Tables', description: 'Hash functions, collision resolution, and load factor', duration: '45 min', content: 'Hash tables map keys to values via hash functions. **Collision resolution**: chaining (linked list per bucket) or open addressing (probe next slot). **Load factor** = items / buckets — resize at ~0.75. Average O(1) for get/set/delete. Worst-case O(n) with bad hash or high load factor.' },
          { id: 'dsa-graphs', title: 'Graph Fundamentals', description: 'Adjacency lists/matrices, BFS, DFS, and cycle detection', duration: '55 min', content: 'Graph = vertices + edges. **Adjacency list**: map vertex → neighbors (space O(V+E)). **Adjacency matrix**: 2D array (space O(V²)). **BFS** (queue): shortest path in unweighted. **DFS** (stack/recursion): path finding, topological sort. Cycle detection: visited states (unvisited/visiting/visited) for directed.' },
          { id: 'dsa-shortest-path', title: 'Shortest Path Algorithms', description: 'Dijkstra, Bellman-Ford, Floyd-Warshall, and A*', duration: '60 min', content: '**Dijkstra**: greedy, O(E log V) with heap, non-negative weights. **Bellman-Ford**: O(VE), handles negative weights, detects negative cycles. **Floyd-Warshall**: O(V³), all-pairs shortest path. **A***: Dijkstra + heuristic (Manhattan/Euclidean), optimal for grid-based pathfinding.' },
        ],
      },
      {
        id: 'dsa-sorting',
        title: 'Sorting & Searching',
        description: 'Comparison sorts, binary search, divide and conquer, and quickselect.',
        lessons: [
          { id: 'dsa-sorting', title: 'Sorting Algorithms', description: 'QuickSort, MergeSort, HeapSort, and comparison analysis', duration: '55 min', content: '**QuickSort**: O(n log n) average, O(n²) worst (bad pivot), in-place, unstable. **MergeSort**: O(n log n) guaranteed, O(n) space, stable. **HeapSort**: O(n log n), in-place, unstable. Language defaults: V8 uses TimSort (hybrid). Use built-in sort unless implementing for learning.' },
          { id: 'dsa-binary-search', title: 'Binary Search', description: 'Classic binary search, rotated arrays, and search space patterns', duration: '45 min', content: 'Binary search halves search space each iteration. Condition: monotonic predicate (FFF...FTT...T). **Rotated array**: find pivot, then binary search on appropriate half. **Search space**: binary search the ANSWER, not the array (e.g., capacity to ship packages). O(log n) time.' },
          { id: 'dsa-divide-conquer', title: 'Divide & Conquer', description: 'Merge sort, quickselect, and master theorem', duration: '50 min', content: '**Divide & Conquer**: divide problem → solve subproblems → combine results. **MergeSort**: divide → sort halves → merge. **QuickSelect**: partition + recurse on one side (O(n) average for kth smallest). **Master theorem**: T(n) = aT(n/b) + f(n) — analyze recurrence complexity.' },
        ],
      },
      {
        id: 'dsa-dp',
        title: 'Dynamic Programming',
        description: 'Memoization, tabulation, and optimization problems.',
        lessons: [
          { id: 'dsa-dp-intro', title: 'DP Fundamentals', description: 'Memoization vs tabulation, optimal substructure, overlapping subproblems', duration: '55 min', content: 'Dynamic Programming = recursion + memoization. Requirements: **optimal substructure** (optimal solution from optimal sub-solutions) and **overlapping subproblems** (same subproblem appears multiple times). **Top-down** (memoization): recursive + cache. **Bottom-up** (tabulation): iterative, builds table. Start with brute-force recursion, add cache. **Interview tip**: DP is lower priority than arrays, trees, or graphs for most interviews. Master the common patterns (Knapsack, LCS, LIS) — they cover 80% of DP questions.' },
          { id: 'dsa-dp-patterns', title: 'Common DP Patterns', description: 'Knapsack, LCS, LIS, matrix chain, and Catalan numbers', duration: '60 min', content: 'Common DP problems and approaches: **0/1 Knapsack** (include/exclude), **Unbounded Knapsack** (coin change — repeat items), **LCS** (2D table, match/mismatch), **LIS** (O(n log n) with patience sorting), **Matrix Chain** (gap filling), **Catalan** (BST counting). Learn patterns, not individual problems.' },
          { id: 'dsa-dp-advanced', title: 'Advanced DP', description: 'DP on trees, bitmask DP, and probability DP', duration: '55 min', content: '**DP on trees**: DFS returns DP values for subtree (tree diameter, max independent set). **Bitmask DP**: use bits to represent set membership, optimize with precomputed masks (TSP, subset partitioning). **Probability DP**: expected value computations. Practice 10-15 problems per pattern.' },
        ],
      },
    ],
  },
  {
    id: 'typescript-deep-dive',
    title: 'TypeScript Deep Dive',
    description: 'From type system basics to advanced generics, utility types, and real-world patterns for building scalable applications.',
    icon: 'typescript',
    level: 'intermediate',
    duration: '6 weeks',
    enrolled_count: 1892,
    rating: 4.7,
    color: 'from-blue-500 to-violet-500',
    objectives: [
      'Understand TypeScript\'s type system and type inference',
      'Use generics and advanced types to build flexible APIs',
      'Configure TypeScript for different project environments',
      'Integrate TypeScript with React and Node.js',
      'Apply real-world patterns for type-safe applications',
    ],
    modules: [
      {
        id: 'ts-basics',
        title: 'Type System Basics',
        description: 'Primitives, interfaces, type aliases, unions, and intersections.',
        lessons: [
          { id: 'ts-primitives', title: 'Primitives & Annotations', description: 'Basic types, type inference, and type annotations', duration: '40 min', content: 'TypeScript adds static types to JavaScript. Basics: `number`, `string`, `boolean`, `null`, `undefined`, `void`, `never`, `any`, `unknown`. Use `: type` annotations for parameters/returns. TypeScript infers types from values — let inference work unless needed. Avoid `any` — use `unknown` and narrow with type guards. **2026**: TypeScript is the #1 language on GitHub by contributors. TS 6.0 made `strict: true` the default and is the last JS-based compiler — TS 7.0 (Go rewrite) brings 10x build speed.' },
          { id: 'ts-interfaces', title: 'Interfaces & Type Aliases', description: 'Interfaces, extends, type aliases, and differences', duration: '45 min', content: '**Interfaces** (`interface Foo { ... }`) define object shapes. **Type aliases** (`type Foo = ...`) create type unions/intersections. Prefer interface for object types (extensible, better errors). Use type for unions, tuples, primitives. Interface extends other interfaces; type intersections use `&`.' },
          { id: 'ts-unions', title: 'Unions, Intersections & Literals', description: 'Union/intersection types, literal types, and discriminated unions', duration: '50 min', content: '**Union**: `string | number` — value is one of the types. **Intersection**: `A & B` — value satisfies both. **Literal types**: `"success" | "error"`. **Discriminated unions**: common `type` field, TypeScript narrows with switch/if. Exhaustive checking: use `never` in default case.' },
        ],
      },
      {
        id: 'ts-generics',
        title: 'Generics & Advanced Types',
        description: 'Generic functions, constraints, mapped types, and conditional types.',
        lessons: [
          { id: 'ts-generics-basics', title: 'Generic Functions & Types', description: 'Type parameters, constraints, and generic inference', duration: '50 min', content: 'Generics capture type info for reuse: `function identity<T>(arg: T): T`. Constraints restrict: `<T extends HasLength>`. Multiple params: `<K, V>`. Generic inference figures out T from usage. Generic interfaces/types: `interface Box<T> { value: T }`. Defaults: `T = string`.' },
          { id: 'ts-mapped', title: 'Mapped & Conditional Types', description: 'Key remapping, template literals, and conditional branching', duration: '55 min', content: '**Mapped types**: `{ [K in keyof T]: T[K] | null }`. Add/remove modifiers with `+`/`-` or `as` for key remapping. **Conditional**: `T extends U ? X : Y`. Distributive over unions. **Template literal types**: `` `${K}Id` ``. **infer** keyword extracts types in conditional branches.' },
          { id: 'ts-utility', title: 'Utility Types & Patterns', description: 'Partial, Pick, Omit, Extract, and building custom utilities', duration: '50 min', content: 'Built-in: `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>`, `Readonly<T>`, `Record<K, V>`, `Extract<T, U>`, `Exclude<T, U>`, `ReturnType<T>`, `Parameters<T>`. Build custom: `type DeepPartial<T> = T extends object ? { [P in keyof T]?: DeepPartial<T[P]> } : T`.' },
        ],
      },
      {
        id: 'ts-classes',
        title: 'Classes & Decorators',
        description: 'OOP in TypeScript, parameter properties, decorators, and metadata.',
        lessons: [
          { id: 'ts-classes', title: 'Classes & Inheritance', description: 'Access modifiers, abstract classes, and parameter properties', duration: '45 min', content: 'TypeScript enhances classes: `public` (default), `private`, `protected`. **Parameter properties** shortcut: `constructor(public name: string)`. **Abstract classes** cannot be instantiated, define abstract methods. `readonly` prevents reassignment. `static` members belong to class, not instances.' },
          { id: 'ts-decorators', title: 'Decorators & Metadata', description: 'Class, method, property, and parameter decorators; Reflect metadata', duration: '50 min', content: 'Decorators are functions that modify classes/members. Enable with `experimentalDecorators: true`. Types: class, method (can wrap/replace), property, parameter, accessor. Accessor decorators: use instead of method decorator for getters/setters. `reflect-metadata` for advanced patterns (dependency injection).' },
        ],
      },
      {
        id: 'ts-config',
        title: 'Modules & Configuration',
        description: 'Project references, tsconfig, module resolution, and build tooling.',
        lessons: [
          { id: 'ts-modules', title: 'Modules & Namespaces', description: 'ES modules, namespace patterns, and module resolution strategies', duration: '40 min', content: 'TypeScript supports ES modules (`import/export`). **Namespace** (`namespace Foo`) is legacy — prefer ES modules. **Module resolution**: `node` (looks in node_modules) or `node16`/`nodenext` (ESM-aware). Path aliases: set in tsconfig `paths` + baseUrl. `.d.ts` files declare types for JS libraries.' },
          { id: 'ts-tsconfig', title: 'tsconfig Deep Dive', description: 'Compiler options, strict mode, project references, and path mapping', duration: '45 min', content: 'Enable `strict: true` — enables all strict checks (noImplicitAny, strictNullChecks, etc.). Key options: `target` (ES2022), `module` (ESNext/NodeNext), `moduleResolution`. **Project references** speed up monorepo builds. `outDir` for compiled output, `rootDir` for source. TS 6.0 adds `--erasableSyntaxOnly` (prohibits enums/namespaces/parameter properties for esbuild compatibility), **subpath imports** (precise paths mappings), and `--stableTypeOrdering` (for TS 7.0 migration). `moduleResolution: "bundler"` is the modern choice.' },
        ],
      },
      {
        id: 'ts-real-world',
        title: 'Real-World TypeScript',
        description: 'TypeScript with React, Node.js, testing, and migration strategies.',
        lessons: [
          { id: 'ts-react', title: 'TypeScript with React', description: 'Typing components, hooks, events, and context in React', duration: '55 min', content: 'Type React components: `React.FC<Props>` or inline `({ name }: { name: string })`. Hook types: `useState<T>()`, `useRef<HTMLDivElement>(null)`, typed reducers. Events: `React.ChangeEvent<HTMLInputElement>`. Context: `createContext<Type>(default)`. Generic components: `<T extends ...>`. React 19 is TypeScript-first — new hooks (`use()`, `useActionState`, `useOptimistic`) have full type definitions. Enable `strict: true` in tsconfig for type-safe React.' },
          { id: 'ts-node', title: 'TypeScript with Node.js', description: 'Express types, middleware patterns, and API typing', duration: '50 min', content: 'Use `tsx` (formerly ts-node) for running. Express typing: extend `Request` with custom properties via declaration merging. Validate request body at runtime (zod) with inferred types: `z.infer<typeof schema>`. `Prisma` generates types from your DB schema automatically. **2026**: `tsx` is the standard for running TS in Node. Node.js supports ESM natively — use `"type": "module"` in package.json. Bun is an emerging alternative with built-in TS support and faster package installs.' },
          { id: 'ts-migration', title: 'Migration & Best Practices', description: 'Migrating JS to TS, strict adoption, and team patterns', duration: '45 min', content: '**Migration**: rename .js → .ts, add `// @ts-check`, enable strict incrementally. Add `any` as escape hatch, then `noImplicitAny`. **Patterns**: use branded types for IDs, `satisfies` for type validation, `as const` for literals. **Team**: enforce with ESLint `@typescript-eslint`, use project references for monorepos. TS is now used by 35%+ of GitHub repos and 90%+ of npm packages ship types. Enable `noUncheckedIndexedAccess` — `array[0]` returns `T | undefined` preventing common runtime errors.' },
        ],
      },
    ],
  },
];



