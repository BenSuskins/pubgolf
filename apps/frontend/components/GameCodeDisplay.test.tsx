import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { GameCodeDisplay } from './GameCodeDisplay';

// @ts-expect-error - jest-axe types not compatible with bun:test
expect.extend(toHaveNoViolations);

// Mock clipboard
const mockWriteText = mock(async () => {});

describe('GameCodeDisplay', () => {
  beforeEach(() => {
    // Reset clipboard mock before each test
    mockWriteText.mockClear();
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  describe('rendering', () => {
    test('should render game code in uppercase', () => {
      render(<GameCodeDisplay gameCode="abcd" />);
      expect(screen.getByText('ABCD')).toBeInTheDocument();
    });

    test('should display game code with proper styling', () => {
      render(<GameCodeDisplay gameCode="TEST" />);
      const codeElement = screen.getByText('TEST');
      expect(codeElement.className).toContain('font-mono');
      expect(codeElement.className).toContain('tracking-widest');
      expect(codeElement.className).toContain('font-bold');
    });

    test('should render copy button', () => {
      render(<GameCodeDisplay gameCode="TEST" />);
      expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument();
    });

    test('should render with medium size by default', () => {
      render(<GameCodeDisplay gameCode="TEST" />);
      const codeElement = screen.getByText('TEST');
      expect(codeElement.className).toContain('text-4xl');
    });

    test('should render with large size when specified', () => {
      render(<GameCodeDisplay gameCode="TEST" size="lg" />);
      const codeElement = screen.getByText('TEST');
      expect(codeElement.className).toContain('text-5xl');
    });
  });

  describe('copy functionality', () => {
    test('should trigger copy action on button click', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      const initialButton = screen.getByRole('button', { name: /copy game code/i });
      await user.click(initialButton);

      // Verify success state appears
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      });
    });

    test('should show success state after copying', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      });
    });

    test('should show checkmark icon in success state', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        const button = screen.getByRole('button', { name: /copied/i });
        expect(button.querySelector('svg')).toBeInTheDocument();
      });
    });

    test('should reset to initial state after timeout', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      });

      // Wait for timeout (3000ms)
      await waitFor(
        () => {
          expect(screen.getByRole('button', { name: /copy game code/i })).toBeInTheDocument();
        },
        { timeout: 4000 }
      );
    });

    test('should handle clipboard API failure gracefully', async () => {
      // Mock clipboard failure
      const mockFailingWriteText = mock(async () => {
        throw new Error('Clipboard not available');
      });
      Object.defineProperty(navigator, 'clipboard', {
        value: {
          writeText: mockFailingWriteText,
        },
        writable: true,
        configurable: true,
      });

      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      // Should not crash and button should still be clickable
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });

  describe('keyboard accessibility', () => {
    test('should copy when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      const button = screen.getByRole('button', { name: /copy game code/i });
      button.focus();
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      });
    });

    test('should copy when Space key is pressed', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      const button = screen.getByRole('button', { name: /copy game code/i });
      button.focus();
      await user.keyboard(' ');

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
      });
    });
  });

  describe('screen reader support', () => {
    test('should have aria-live region', () => {
      const { container } = render(<GameCodeDisplay gameCode="TEST" />);
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    test('should announce copy success to screen readers', async () => {
      const user = userEvent.setup();
      render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(() => {
        const liveRegion = screen.getByText(/copied to clipboard/i);
        expect(liveRegion).toBeInTheDocument();
      });
    });

    test('should have descriptive button label', () => {
      render(<GameCodeDisplay gameCode="TEST" />);
      expect(screen.getByRole('button', { name: /copy game code/i })).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have no accessibility violations (default)', async () => {
      const { container } = render(<GameCodeDisplay gameCode="TEST" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (large size)', async () => {
      const { container } = render(<GameCodeDisplay gameCode="TEST" size="lg" />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations (after copy)', async () => {
      const user = userEvent.setup();
      const { container } = render(<GameCodeDisplay gameCode="TEST" />);

      await user.click(screen.getByRole('button', { name: /copy/i }));

      await waitFor(async () => {
        const results = await axe(container);
        expect(results).toHaveNoViolations();
      });
    });
  });
});
