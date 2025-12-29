import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShareModal } from './ShareModal';

// Mock react-qr-code
mock.module('react-qr-code', () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value}>
      QR Code Mock
    </div>
  ),
}));

describe('ShareModal', () => {
  const mockOnClose = mock(() => {});

  beforeEach(() => {
    mockOnClose.mockClear();
    // Reset clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: mock(() => Promise.resolve()),
        readText: mock(() => Promise.resolve('')),
      },
      writable: true,
    });
  });

  describe('rendering', () => {
    test('should render modal with title', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      expect(screen.getByText('Rally Your Crew')).toBeInTheDocument();
    });

    test('should display game code in uppercase', () => {
      render(<ShareModal gameCode="abcd" onClose={mockOnClose} />);

      expect(screen.getByText('ABCD')).toBeInTheDocument();
    });

    test('should render QR code component', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      expect(screen.getByTestId('qr-code')).toBeInTheDocument();
    });

    test('should render "Copy Invite Link" and "Done" buttons', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      expect(screen.getByText('Copy Invite Link')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    test('should display "Game Code" label', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      expect(screen.getByText('Game Code')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    test('should have correct ARIA attributes', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'share-modal-title');
    });

    test('should have accessible labels on buttons', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      expect(
        screen.getByRole('button', { name: /copy invite link/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /close share modal/i })
      ).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    test('should close modal on Escape key', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('copy functionality', () => {
    test('should show "Copied!" text after successful copy', async () => {
      const user = userEvent.setup();
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      await user.click(screen.getByText('Copy Invite Link'));

      await waitFor(() => {
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });
  });

  describe('close functionality', () => {
    test('should call onClose when Done button clicked', async () => {
      const user = userEvent.setup();
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      await user.click(screen.getByText('Done'));

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should call onClose when clicking backdrop', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      // Click on the backdrop (the outer div)
      const dialog = screen.getByRole('dialog');
      fireEvent.click(dialog);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('should not close when clicking modal content', () => {
      render(<ShareModal gameCode="ABCD" onClose={mockOnClose} />);

      // Click on the modal title (inside the modal)
      fireEvent.click(screen.getByText('Rally Your Crew'));

      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('share link generation', () => {
    test('should generate share link with game code', () => {
      render(<ShareModal gameCode="WXYZ" onClose={mockOnClose} />);

      const qrCode = screen.getByTestId('qr-code');
      expect(qrCode.getAttribute('data-value')).toContain('gameCode=WXYZ');
    });
  });
});
