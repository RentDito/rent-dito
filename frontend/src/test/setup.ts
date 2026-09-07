import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without injected globals, so Testing Library's automatic cleanup
// is not registered. Unmount explicitly to keep portalled dialogs, drawers, and
// toasts from leaking into the next test.
afterEach(() => {
  cleanup();
});
