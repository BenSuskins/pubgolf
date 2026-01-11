import { describe, test, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { ActiveEventBanner } from './ActiveEventBanner';

describe('ActiveEventBanner', () => {
  test('should display the event name', () => {
    render(<ActiveEventBanner eventName="Power Hour" />);

    expect(screen.getByText('Active Event: Power Hour')).toBeInTheDocument();
  });

  test('should render with different event names', () => {
    const { rerender } = render(<ActiveEventBanner eventName="Double Trouble" />);

    expect(screen.getByText('Active Event: Double Trouble')).toBeInTheDocument();

    rerender(<ActiveEventBanner eventName="Lefty Lucy" />);

    expect(screen.getByText('Active Event: Lefty Lucy')).toBeInTheDocument();
  });

  test('should have proper styling classes', () => {
    const { container } = render(<ActiveEventBanner eventName="Test Event" />);

    const banner = container.firstChild as HTMLElement;
    expect(banner).toHaveClass('rounded-lg');
  });
});
