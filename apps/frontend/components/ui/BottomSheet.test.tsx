import { describe, test, expect, mock } from 'bun:test';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BottomSheet } from './BottomSheet';

function renderSheet(onClose = mock(() => {}), locked = false) {
  render(
    <BottomSheet
      title="New Route"
      description="Par carries over."
      onClose={onClose}
      locked={locked}
      footer={<button type="button">CREATE ROUTE</button>}
    >
      <input aria-label="Route name" />
    </BottomSheet>
  );
  return onClose;
}

describe('BottomSheet', () => {
  test('should render as a labelled modal dialog', () => {
    renderSheet();

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'New Route' })).toBeInTheDocument();
    expect(screen.getByText('Par carries over.')).toBeInTheDocument();
  });

  test('should render its content and footer', () => {
    renderSheet();

    expect(screen.getByLabelText('Route name')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'CREATE ROUTE' })).toBeInTheDocument();
  });

  test('should close on Escape', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.keyboard('{Escape}');

    expect(onClose).toHaveBeenCalled();
  });

  test('should close when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.click(screen.getByRole('dialog'));

    expect(onClose).toHaveBeenCalled();
  });

  test('should not close when the sheet itself is clicked', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet();

    await user.click(screen.getByRole('heading', { name: 'New Route' }));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('should ignore Escape and backdrop clicks while locked', async () => {
    const user = userEvent.setup();
    const onClose = renderSheet(mock(() => {}), true);

    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('dialog'));

    expect(onClose).not.toHaveBeenCalled();
  });

  test('should move focus into the sheet on open', () => {
    renderSheet();

    expect(document.activeElement).toBe(screen.getByLabelText('Route name'));
  });
});
