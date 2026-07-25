import { describe, test, expect, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseEditor } from './CourseEditor';
import type { RouteHole } from '@/lib/types';

const holes: RouteHole[] = [
  { hole: 1, par: 1, drinks: { 'Route A': 'Tequila', 'Route B': 'Sambuca' } },
  { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
];

describe('CourseEditor', () => {
  describe('rendering', () => {
    test('should render a drink field per route for every hole', () => {
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      expect(screen.getByLabelText('Hole 1 drink on Route A')).toHaveValue('Tequila');
      expect(screen.getByLabelText('Hole 1 drink on Route B')).toHaveValue('Sambuca');
      expect(screen.getByLabelText('Hole 2 drink on Route A')).toHaveValue('Beer');
      expect(screen.getByLabelText('Hole 2 par')).toHaveValue(3);
    });

    test('should render an editable name per route', () => {
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      expect(screen.getByLabelText('Route 1 name')).toHaveValue('Route A');
      expect(screen.getByLabelText('Route 2 name')).toHaveValue('Route B');
    });

    test('should disable save until something changes', () => {
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      expect(screen.getByRole('button', { name: /save drinks & pars/i })).toBeDisabled();
    });
  });

  describe('editing', () => {
    test('should save edited drinks and pars', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Route A': 'Cider', 'Route B': 'Sambuca' } },
          { hole: 2, par: 3, drinks: { 'Route A': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should keep a route column when it is renamed', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Route 1 name'));
      await user.type(screen.getByLabelText('Route 1 name'), 'Ale Trail');
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      await waitFor(() => {
        expect(onSave).toHaveBeenCalledWith([
          { hole: 1, par: 1, drinks: { 'Ale Trail': 'Tequila', 'Route B': 'Sambuca' } },
          { hole: 2, par: 3, drinks: { 'Ale Trail': 'Beer', 'Route B': 'Vodka' } },
        ]);
      });
    });

    test('should add a route with an empty drink for every hole', async () => {
      const user = userEvent.setup();
      render(<CourseEditor holes={holes} onSave={mock(async () => {})} />);

      await user.click(screen.getByRole('button', { name: /\+ route/i }));

      expect(screen.getByLabelText('Route 3 name')).toHaveValue('Route C');
      expect(screen.getByLabelText('Hole 1 drink on Route C')).toHaveValue('');
    });

    test('should remove a route and its drinks', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.click(screen.getByRole('button', { name: /remove route b/i }));
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

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

      await user.clear(screen.getByLabelText('Hole 2 drink on Route B'));
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      expect(screen.getByText(/every route needs a drink for hole 2/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should reject a blank route name', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Route 2 name'));
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      expect(screen.getByText(/every route needs a name/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should reject duplicate route names', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Route 2 name'));
      await user.type(screen.getByLabelText('Route 2 name'), 'route a');
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      expect(screen.getByText(/route names must be unique/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });

    test('should reject a par outside the allowed range', async () => {
      const user = userEvent.setup();
      const onSave = mock(async () => {});
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Hole 1 par'));
      await user.type(screen.getByLabelText('Hole 1 par'), '11');
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      expect(screen.getByText(/par for hole 1 must be between 1 and 10/i)).toBeInTheDocument();
      expect(onSave).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should show the failure from the API', async () => {
      const user = userEvent.setup();
      const onSave = mock(() => Promise.reject(new Error('Only the host can change drinks and pars')));
      render(<CourseEditor holes={holes} onSave={onSave} />);

      await user.clear(screen.getByLabelText('Hole 1 drink on Route A'));
      await user.type(screen.getByLabelText('Hole 1 drink on Route A'), 'Cider');
      await user.click(screen.getByRole('button', { name: /save drinks & pars/i }));

      await waitFor(() => {
        expect(screen.getByText(/only the host can change drinks and pars/i)).toBeInTheDocument();
      });
    });
  });
});
