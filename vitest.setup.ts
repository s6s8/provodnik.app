import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; Radix form controls (Checkbox/Switch hidden
// inputs) call it on mount. Guarded so it never clobbers a real/other polyfill.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
