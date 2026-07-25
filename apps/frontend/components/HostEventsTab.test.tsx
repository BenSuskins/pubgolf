import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HostEventsTab } from './HostEventsTab';
import type { ActiveEvent, GameEvent } from '@/lib/types';

const events: GameEvent[] = [
  { id: 'photo-op', title: 'Photo Op', description: 'Group photo at this venue' },
  { id: 'speed-round', title: 'Speed Round', description: 'Finish within 2 minutes' },
];

const activeSpeedRound: ActiveEvent = {
  id: 'speed-round',
  title: 'Speed Round',
  description: 'Finish within 2 minutes',
  activatedAt: '2026-07-25T20:00:00Z',
};

function renderTab(overrides: Partial<Parameters<typeof HostEventsTab>[0]> = {}) {
  const props = {
    events,
    activeEvent: null,
    activatingEventId: null,
    onActivate: mock(() => {}),
    onOpenCustomEvent: mock(() => {}),
    ...overrides,
  };
  render(<HostEventsTab {...props} />);
  return props;
}

describe('HostEventsTab', () => {
  test('should offer every preset for activation', () => {
    renderTab();

    expect(screen.getByText('Photo Op')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Activate' })).toHaveLength(2);
  });

  test('should activate the chosen preset', async () => {
    const user = userEvent.setup();
    const { onActivate } = renderTab();

    await user.click(screen.getAllByRole('button', { name: 'Activate' })[0]);

    expect(onActivate).toHaveBeenCalledWith(events[0]);
  });

  test('should mark the live preset and lock the others', () => {
    renderTab({ activeEvent: activeSpeedRound });

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Activate' })).toBeDisabled();
  });

  test('should open the custom event sheet', async () => {
    const user = userEvent.setup();
    const { onOpenCustomEvent } = renderTab();

    await user.click(screen.getByRole('button', { name: /custom event/i }));

    expect(onOpenCustomEvent).toHaveBeenCalled();
  });

  test('should not offer a custom event while one is already live', () => {
    renderTab({ activeEvent: activeSpeedRound });

    expect(screen.getByRole('button', { name: /custom event/i })).toBeDisabled();
  });

  test('should explain when a game has no events', () => {
    renderTab({ events: [] });

    expect(screen.getByText('No events configured for this game yet')).toBeInTheDocument();
  });
});
