import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AddRouteSheet } from './AddRouteSheet';

const pars = [4, 3, 2];

function renderSheet(overrides: Partial<Parameters<typeof AddRouteSheet>[0]> = {}) {
  const props = {
    pars,
    existingNames: ['Ale Trail'],
    maxNameLength: 40,
    maxDrinkLength: 100,
    onCreate: mock(() => {}),
    onClose: mock(() => {}),
    ...overrides,
  };
  render(<AddRouteSheet {...props} />);
  return props;
}

describe('AddRouteSheet', () => {
  test('should state that par is inherited and list the values', () => {
    renderSheet();

    expect(screen.getByText(/it'll use the same 3-hole par \(4, 3, 2\)/i)).toBeInTheDocument();
  });

  test('should show par per hole as read-only text, not an input', () => {
    renderSheet();

    expect(
      screen.getByLabelText('Hole 1 par is 4, shared across routes').tagName.toLowerCase()
    ).toBe('span');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });

  test('should create the route with a drink per hole', async () => {
    const user = userEvent.setup();
    const { onCreate } = renderSheet();

    await user.type(screen.getByLabelText('Route name'), 'Wine Walk');
    await user.type(screen.getByLabelText('New route drink for hole 1'), 'Merlot');
    await user.type(screen.getByLabelText('New route drink for hole 2'), 'Rioja');
    await user.click(screen.getByRole('button', { name: 'CREATE ROUTE' }));

    expect(onCreate).toHaveBeenCalledWith('Wine Walk', ['Merlot', 'Rioja', '']);
  });

  test('should require a name', async () => {
    const user = userEvent.setup();
    const { onCreate } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'CREATE ROUTE' }));

    expect(screen.getByText('Give the route a name')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  test('should reject a name an existing route already uses', async () => {
    const user = userEvent.setup();
    const { onCreate } = renderSheet();

    await user.type(screen.getByLabelText('Route name'), 'ale trail');
    await user.click(screen.getByRole('button', { name: 'CREATE ROUTE' }));

    expect(screen.getByText('Route names must be unique')).toBeInTheDocument();
    expect(onCreate).not.toHaveBeenCalled();
  });

  test('should dismiss without creating on cancel', async () => {
    const user = userEvent.setup();
    const { onCreate, onClose } = renderSheet();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onCreate).not.toHaveBeenCalled();
  });
});
