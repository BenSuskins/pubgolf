import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventModal } from './EventModal';
import { EventPayload } from '@/lib/types';

describe('EventModal', () => {
  const defaultEvent: EventPayload = {
    eventId: 'power-hour',
    name: 'Power Hour',
    description: 'Everyone must finish their drink within the hour!',
  };

  const defaultProps = {
    event: defaultEvent,
    onDismiss: mock(() => {}),
  };

  test('should display the event name', () => {
    render(<EventModal {...defaultProps} />);

    expect(screen.getByText('Power Hour')).toBeInTheDocument();
  });

  test('should display the event description', () => {
    render(<EventModal {...defaultProps} />);

    expect(
      screen.getByText('Everyone must finish their drink within the hour!')
    ).toBeInTheDocument();
  });

  test('should display the celebration emoji', () => {
    render(<EventModal {...defaultProps} />);

    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  test('should display Got it button', () => {
    render(<EventModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Got it' })).toBeInTheDocument();
  });

  test('should call onDismiss when Got it button is clicked', () => {
    const onDismiss = mock(() => {});
    render(<EventModal {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.click(screen.getByRole('button', { name: 'Got it' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should call onDismiss when backdrop is clicked', () => {
    const onDismiss = mock(() => {});
    const { container } = render(<EventModal {...defaultProps} onDismiss={onDismiss} />);

    const backdrop = container.querySelector('.fixed');
    fireEvent.click(backdrop!);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should call onDismiss when Escape key is pressed', () => {
    const onDismiss = mock(() => {});
    render(<EventModal {...defaultProps} onDismiss={onDismiss} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  test('should have proper dialog role and aria attributes', () => {
    render(<EventModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'event-modal-title');
  });

  test('should not call onDismiss when clicking inside modal content', () => {
    const onDismiss = mock(() => {});
    render(<EventModal {...defaultProps} onDismiss={onDismiss} />);

    const title = screen.getByText('Power Hour');
    fireEvent.click(title);

    expect(onDismiss).not.toHaveBeenCalled();
  });

  test('should display different events correctly', () => {
    const differentEvent: EventPayload = {
      eventId: 'double-trouble',
      name: 'Double Trouble',
      description: 'All sips count double for the next hole!',
    };

    render(<EventModal event={differentEvent} onDismiss={mock(() => {})} />);

    expect(screen.getByText('Double Trouble')).toBeInTheDocument();
    expect(screen.getByText('All sips count double for the next hole!')).toBeInTheDocument();
  });
});
