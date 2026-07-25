import { describe, test, expect, mock, beforeEach } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HostPanelPage from './page';
import type { ActiveEvent, GameState } from '@/lib/types';

const HOST_PLAYER_ID = 'host-1';

const course = [
  { hole: 1, par: 4, drinks: { 'Ale Trail': 'Espresso Martini' } },
  { hole: 2, par: 3, drinks: { 'Ale Trail': 'Beer' } },
];

let activeEvent: ActiveEvent | null = null;

const gameState = (): GameState => ({
  gameId: 'game-1',
  gameCode: 'par780',
  status: 'ACTIVE',
  hostPlayerId: HOST_PLAYER_ID,
  players: [],
  activeEvent,
  holes: course,
});

const mockGetGameState = mock(() => Promise.resolve(gameState()));
const mockGetAvailableEvents = mock(() =>
  Promise.resolve({
    events: [{ id: 'photo-op', title: 'Photo Op', description: 'Group photo at this venue' }],
  })
);
const mockGetRoute = mock(() =>
  Promise.resolve({
    pubs: [
      { hole: 1, name: 'Crown & Anchor', latitude: 51.5, longitude: -0.1 },
      { hole: 2, name: 'Ship & Compass', latitude: 51.5, longitude: -0.11 },
    ],
    route: null,
  })
);
const mockActivateCustomEvent = mock((_code: string, title: string, description: string) => {
  activeEvent = { id: 'custom', title, description, activatedAt: '2026-07-25T20:00:00Z' };
  return Promise.resolve(gameState());
});
const mockEndEvent = mock(() => {
  activeEvent = null;
  return Promise.resolve(gameState());
});

mock.module('@/lib/api', () => ({
  getGameState: mockGetGameState,
  getAvailableEvents: mockGetAvailableEvents,
  getRoute: mockGetRoute,
  activateEvent: mock(() => Promise.resolve(gameState())),
  activateCustomEvent: mockActivateCustomEvent,
  endEvent: mockEndEvent,
  completeGame: mock(() => Promise.resolve(gameState())),
  setHoles: mock(() => Promise.resolve(gameState())),
}));

mock.module('@/hooks/useLocalStorage', () => ({
  useLocalStorage: () => ({
    getGameCode: () => 'par780',
    getPlayerId: () => HOST_PLAYER_ID,
    setGameSession: () => {},
    clearSession: () => {},
  }),
}));

mock.module('@/hooks/useGameWebSocket', () => ({
  useGameWebSocket: () => ({ isConnected: true, connectionError: null }),
}));

mock.module('next/navigation', () => ({
  useRouter: () => ({ push: mock(() => {}) }),
  useParams: () => ({ code: 'par780' }),
}));

async function renderPanel() {
  render(<HostPanelPage />);
  await waitFor(() => {
    expect(screen.getByRole('heading', { name: 'PAR780' })).toBeInTheDocument();
  });
}

describe('HostPanelPage', () => {
  beforeEach(() => {
    activeEvent = null;
  });

  test('should land on the Events tab', async () => {
    await renderPanel();

    expect(screen.getByRole('button', { name: 'Events' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Trigger an Event')).toBeInTheDocument();
    expect(screen.queryByText('Drinks & Pars')).not.toBeInTheDocument();
  });

  test('should show course setup on the Course tab', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: 'Course' }));

    expect(screen.getByText('Drinks & Pars')).toBeInTheDocument();
    expect(screen.getByText('2 pubs mapped')).toBeInTheDocument();
    expect(screen.getByLabelText('Hole 1 drink on Ale Trail')).toHaveValue('Espresso Martini');
    expect(screen.queryByText('Trigger an Event')).not.toBeInTheDocument();
  });

  test('should trigger a custom event from the sheet and show it on both tabs', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /custom event/i }));
    await user.type(screen.getByLabelText('Event name'), 'Karaoke Break');
    await user.click(screen.getByRole('button', { name: 'TRIGGER NOW' }));

    await waitFor(() => {
      expect(screen.getByText('Active Event')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Karaoke Break' })).toBeInTheDocument();

    // The active event is game-wide, so it follows the host onto the Course tab.
    await user.click(screen.getByRole('button', { name: 'Course' }));
    expect(screen.getByRole('heading', { name: 'Karaoke Break' })).toBeInTheDocument();
  });

  test('should clear the banner when the event is ended', async () => {
    const user = userEvent.setup();
    await renderPanel();

    await user.click(screen.getByRole('button', { name: /custom event/i }));
    await user.type(screen.getByLabelText('Event name'), 'Karaoke Break');
    await user.click(screen.getByRole('button', { name: 'TRIGGER NOW' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'End Event' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: 'End Event' }));

    await waitFor(() => {
      expect(screen.queryByText('Active Event')).not.toBeInTheDocument();
    });
  });
});
