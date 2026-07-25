import { describe, test, expect, mock } from 'bun:test';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomEventSheet } from './CustomEventSheet';

describe('CustomEventSheet', () => {
  test('should explain that the event is not saved as a preset', () => {
    render(<CustomEventSheet onTrigger={mock(async () => {})} onClose={mock(() => {})} />);

    expect(screen.getByRole('heading', { name: 'Custom Event' })).toBeInTheDocument();
    expect(screen.getByText(/not saved as a preset/i)).toBeInTheDocument();
  });

  test('should trigger the event and close', async () => {
    const user = userEvent.setup();
    const onTrigger = mock(async () => {});
    const onClose = mock(() => {});
    render(<CustomEventSheet onTrigger={onTrigger} onClose={onClose} />);

    await user.type(screen.getByLabelText('Event name'), 'Karaoke Break');
    await user.type(screen.getByLabelText('Description (optional)'), 'Sing something');
    await user.click(screen.getByRole('button', { name: 'TRIGGER NOW' }));

    await waitFor(() => {
      expect(onTrigger).toHaveBeenCalledWith('Karaoke Break', 'Sing something');
      expect(onClose).toHaveBeenCalled();
    });
  });

  test('should require a name before triggering', async () => {
    const user = userEvent.setup();
    const onTrigger = mock(async () => {});
    render(<CustomEventSheet onTrigger={onTrigger} onClose={mock(() => {})} />);

    await user.click(screen.getByRole('button', { name: 'TRIGGER NOW' }));

    expect(screen.getByText('Give the event a name')).toBeInTheDocument();
    expect(onTrigger).not.toHaveBeenCalled();
  });

  test('should keep the sheet open and show the failure when triggering fails', async () => {
    const user = userEvent.setup();
    const onTrigger = mock(() => Promise.reject(new Error('An event is already active')));
    const onClose = mock(() => {});
    render(<CustomEventSheet onTrigger={onTrigger} onClose={onClose} />);

    await user.type(screen.getByLabelText('Event name'), 'Karaoke Break');
    await user.click(screen.getByRole('button', { name: 'TRIGGER NOW' }));

    await waitFor(() => {
      expect(screen.getByText('An event is already active')).toBeInTheDocument();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  test('should dismiss without triggering on cancel', async () => {
    const user = userEvent.setup();
    const onTrigger = mock(async () => {});
    const onClose = mock(() => {});
    render(<CustomEventSheet onTrigger={onTrigger} onClose={onClose} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onTrigger).not.toHaveBeenCalled();
  });
});
