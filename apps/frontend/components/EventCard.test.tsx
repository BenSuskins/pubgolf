import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventCard } from './EventCard';
import { Event } from '@/lib/types';

describe('EventCard', () => {
  const defaultEvent: Event = {
    id: 'power-hour',
    name: 'Power Hour',
    description: 'Everyone must finish their drink within the hour!',
  };

  const defaultProps = {
    event: defaultEvent,
    isActive: false,
    isDisabled: false,
    onSelect: mock(() => {}),
    onEndEvent: mock(() => {}),
  };

  test('should display the event name', () => {
    render(<EventCard {...defaultProps} />);

    expect(screen.getByText('Power Hour')).toBeInTheDocument();
  });

  test('should display the event description', () => {
    render(<EventCard {...defaultProps} />);

    expect(
      screen.getByText('Everyone must finish their drink within the hour!')
    ).toBeInTheDocument();
  });

  test('should call onSelect when clicked and not disabled or active', () => {
    const onSelect = mock(() => {});
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('should not call onSelect when disabled', () => {
    const onSelect = mock(() => {});
    render(<EventCard {...defaultProps} onSelect={onSelect} isDisabled={true} />);

    const card = screen.getByRole('button');
    fireEvent.click(card);

    expect(onSelect).not.toHaveBeenCalled();
  });

  test('should not call onSelect when active', () => {
    const onSelect = mock(() => {});
    render(<EventCard {...defaultProps} onSelect={onSelect} isActive={true} />);

    // When active, there are two buttons (the card and the End Event button)
    // Click on the card (the outer container with role="button")
    const card = screen.getByText('Power Hour').closest('[role="button"]');
    fireEvent.click(card!);

    expect(onSelect).not.toHaveBeenCalled();
  });

  test('should display End Event button when active', () => {
    render(<EventCard {...defaultProps} isActive={true} />);

    expect(screen.getByRole('button', { name: 'End Event' })).toBeInTheDocument();
  });

  test('should not display End Event button when not active', () => {
    render(<EventCard {...defaultProps} isActive={false} />);

    expect(screen.queryByRole('button', { name: 'End Event' })).not.toBeInTheDocument();
  });

  test('should call onEndEvent when End Event button is clicked', () => {
    const onEndEvent = mock(() => {});
    render(<EventCard {...defaultProps} isActive={true} onEndEvent={onEndEvent} />);

    const endButton = screen.getByRole('button', { name: 'End Event' });
    fireEvent.click(endButton);

    expect(onEndEvent).toHaveBeenCalledTimes(1);
  });

  test('should not propagate click from End Event button to card', () => {
    const onSelect = mock(() => {});
    const onEndEvent = mock(() => {});
    render(
      <EventCard
        {...defaultProps}
        isActive={true}
        onSelect={onSelect}
        onEndEvent={onEndEvent}
      />
    );

    const endButton = screen.getByRole('button', { name: 'End Event' });
    fireEvent.click(endButton);

    expect(onEndEvent).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  test('should have disabled tabindex when disabled', () => {
    render(<EventCard {...defaultProps} isDisabled={true} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '-1');
  });

  test('should have enabled tabindex when not disabled', () => {
    render(<EventCard {...defaultProps} isDisabled={false} />);

    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  test('should call onSelect on Enter key press', () => {
    const onSelect = mock(() => {});
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('should call onSelect on Space key press', () => {
    const onSelect = mock(() => {});
    render(<EventCard {...defaultProps} onSelect={onSelect} />);

    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  test('should apply opacity class when disabled', () => {
    const { container } = render(<EventCard {...defaultProps} isDisabled={true} />);

    const card = container.firstChild as HTMLElement;
    expect(card.className).toContain('opacity-50');
  });
});
