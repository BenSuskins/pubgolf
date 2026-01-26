import { afterEach, beforeEach, mock } from 'bun:test';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import React from 'react';

// Mock framer-motion to avoid animation complexity in tests
mock.module('framer-motion', () => ({
  motion: new Proxy(
    {},
    {
      get: (_, prop) => {
        // Return a component that forwards all props to the native HTML element
        return React.forwardRef<any, any>((props, ref) => {
          const { variants, initial, animate, exit, transition, ...rest } = props;
          return React.createElement(prop as string, { ...rest, ref });
        });
      },
    }
  ),
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Clear localStorage before each test
beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});

// Mock window.matchMedia (not fully implemented in happy-dom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });

  // Mock navigator.clipboard (not fully implemented in happy-dom)
  if (navigator) {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: async () => {},
        readText: async () => '',
      },
      writable: true,
      configurable: true,
    });
  }
}
