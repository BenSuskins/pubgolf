import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventEndModal } from './EventEndModal';

describe('EventEndModal', () => {
  const defaultProps = {
    eventName: 'Power Hour',
    onClose: mock(() => {}),
  };

  test('should display the event name with ended message', () => {
    render(<EventEndModal {...defaultProps} />);

    expect(screen.getByText('Power Hour has ended!')).toBeInTheDocument();
  });

  test('should display close button', () => {
    render(<EventEndModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  test('should call onClose when close button is clicked', () => {
    const onClose = mock(() => {});
    render(<EventEndModal {...defaultProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('should call onClose when backdrop is clicked', () => {
    const onClose = mock(() => {});
    const { container } = render(<EventEndModal {...defaultProps} onClose={onClose} />);

    const backdrop = container.querySelector('.fixed');
    fireEvent.click(backdrop!);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('should call onClose when Escape key is pressed', () => {
    const onClose = mock(() => {});
    render(<EventEndModal {...defaultProps} onClose={onClose} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('should have proper dialog role and aria attributes', () => {
    render(<EventEndModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'event-end-modal-title');
  });

  test('should not call onClose when clicking inside modal content', () => {
    const onClose = mock(() => {});
    render(<EventEndModal {...defaultProps} onClose={onClose} />);

    const title = screen.getByText('Power Hour has ended!');
    fireEvent.click(title);

    expect(onClose).not.toHaveBeenCalled();
  });
});
