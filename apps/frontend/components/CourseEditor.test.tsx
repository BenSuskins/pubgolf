import { describe, test, expect, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseEditor } from './CourseEditor';
import type { RouteHole } from '@/lib/types';

const holes: RouteHole[] = [
  { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
  { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
];

const save = () => screen.getByRole('button', { name: 'SAVE COURSE' });

/** The par stepper reads as a group; its value is the text inside. */
const par = (hole: number) => screen.getByRole('group', { name: `Hole ${hole} par` });
const stepUp = (hole: number) =>
  screen.getByRole('button', { name: `Increase hole ${hole} par` });
const stepDown = (hole: number) =>
  screen.getByRole('button', { name: `Decrease hole ${hole} par` });

/** Tap a chip to view that route; tap the selected one again to rename it. */
async function selectRoute(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.click(screen.getByRole('button', { name }));
}

async function renameRoute(
  user: ReturnType<typeof userEvent.setup>,
  name: string,
  position: number
) {
  // The first tap selects the route; a second tap on the selected one opens rename.
  await user.click(screen.getByRole('button', { name }));
  const label = `Route ${position} name`;
  if (!screen.queryByLabelText(label)) {
    await user.click(screen.getByRole('button', { name }));
  }
  return screen.getByLabelText(label);
}

describe('CourseEditor', () => {
  describe('rendering', () => {
    test('should render the selected route drinks alongside the shared par', () => {
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      expect(screen.getByLabelText('Hole 1 drink on Route A')).toHaveValue('Tequila');
      expect(screen.getByLabelText('Hole 2 drink on Route A')).toHaveValue('Beer');
      expect(par(2)).toHaveTextContent('3');
      // Only the selected route's column is shown.
      expect(screen.queryByLabelText('Hole 1 drink on Route B')).not.toBeInTheDocument();
    });

    test('should swap the drink column when another route is tapped, leaving par alone', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      await selectRoute(user, 'Route B');

      expect(screen.getByLabelText('Hole 1 drink on Route B')).toHaveValue('Sambuca');
      expect(par(2)).toHaveTextContent('3');
      expect(screen.queryByLabelText('Hole 1 drink on Route A')).not.toBeInTheDocument();
    });

    test('should disable save until something changes', () => {
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      expect(save()).toBeDisabled();
    });
  });

  describe('editing', () => {
    test('should save edited drinks and pars', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');
      await user.click(save());

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Route A': 'Cider', 'Route B': 'Sambuca' } },
          { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should edit the drinks of whichever route is selected', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await selectRoute(user, 'Route B');
      await user.clear(screen.getByLabelText('Hole 1 drink on Route B'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route B'), 'Port');
      await user.click(save());

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Port' } },
          { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should keep a route column when it is renamed', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      const nameInput = await renameRoute(user, 'Route A', 1);
      await user.clear(nameInput);
      await user.type(nameInput, 'Ale Trail');
      await user.click(save());

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Ale Trail': 'Tequila', 'Route B': 'Sambuca' } },
          { hole: 2, par: 3, drinks: { 'Ale Trail': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should add a route from the sheet and select it', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      await user.click(screen.getByRole('button', { name: '+ Route' }));
      await user.type(screen.getByLabelText('Route name'), 'Wine Walk');
      await user.type(screen.getByLabelText('New route drink for hole 1'), 'Merlot');
      await user.click(screen.getByRole('button', { name: 'CREATE ROUTE' }));

      expect(screen.getByLabelText('Hole 1 drink on Wine Walk')).toHaveValue('Merlot');
      expect(screen.getByLabelText('Hole 2 drink on Wine Walk')).toHaveValue('');
    });

    test('should remove a route and its drinks', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await selectRoute(user, 'Route B');
      await user.click(screen.getByRole('button', { name: /remove route b/i }));
      await user.click(save());

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Route A': 'Tequila' } },
          { hole: 2, par: 3, drinks: { 'Route A': 'Beer' } },
        ]);
      });
    });

    test('should not offer to remove the only route', () => {
      render(
        <CourseEditor
          holes={[{ hole: 1, par: 1, drinks: { Classic: 'Tequila' } }]}
          onSave={mock(async () => {})}
        />
      );

      expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
    });

    test('should discard changes on reset', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');
      await user.click(screen.getByRole('button', { name: /reset/i }));

      expect(screen.getByLabelText('Hole 1 drink on Route A')).toHaveValue('Tequila');
    });
  });

  describe('validation', () => {
    test('should reject a blank drink without calling the API', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await selectRoute(user, 'Route B');
      await user.clear(screen.getByLabelText('Hole 2 drink on Route B'));
      await user.click(save());

      expect(screen.getByText(/every route needs a drink for hole 2/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should reject a blank route name', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      const nameInput = await renameRoute(user, 'Route B', 2);
      await user.clear(nameInput);
      await user.click(save());

      expect(screen.getByText(/every route needs a name/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should reject duplicate route names', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      const nameInput = await renameRoute(user, 'Route B', 2);
      await user.clear(nameInput);
      await user.type(nameInput, 'route a');
      await user.click(save());

      expect(screen.getByText(/route names must be unique/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should step par up and down and save the new value', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.click(stepUp(1));
      await user.click(stepUp(1));
      await user.click(stepDown(2));
      expect(par(1)).toHaveTextContent('3');
      expect(par(2)).toHaveTextContent('2');

      await user.click(save());

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 3, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
          { hole: 2, par: 2, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should stop stepping at the allowed range', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      // Hole 1 starts at the minimum par of 1.
      expect(stepDown(1)).toBeDisabled();

      for (let i = 0; i < 9; i++) {
        await user.click(stepUp(1));
      }

      expect(par(1)).toHaveTextContent('10');
      expect(stepUp(1)).toBeDisabled();
    });

    test('should leave par alone when a drink is edited', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');

      expect(par(1)).toHaveTextContent('1');
    });
  });

  describe('error handling', () => {
    test('should show the failure from the API', async () => {
      const user = userEvent.setup();
      const onSave = mock(() => Promise.reject(new Error('Only the host can change drinks and pars')));
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');
      await user.click(save());

      await waitFor(() => {
        expect(screen.getByText(/only the host can change drinks and pars/i)).toBeInTheDocument();
      });
    });
  });
});
