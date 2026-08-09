// Test setup for vitest
// Registers @testing-library/jest-dom matchers (toBeInTheDocument, toHaveClass,
// toHaveTextContent, etc.) so component tests can use them without per-file
// imports. The /vitest subpath is the v6 entry point that targets Vitest's
// `expect` API — see https://github.com/testing-library/jest-dom#with-vitest.
import '@testing-library/jest-dom/vitest';
