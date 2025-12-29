import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfirmModal } from './ConfirmModal';

describe('ConfirmModal', () => {
  const defaultProps = {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    onConfirm: mock(() => {}),
    onCancel: mock(() => {}),
  };

  test('should display title and message', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
  });

  test('should display confirm and cancel buttons', () => {
    render(<ConfirmModal {...defaultProps} />);

    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('should call onConfirm when confirm button is clicked', () => {
    const onConfirm = mock(() => {});
    render(<ConfirmModal {...defaultProps} onConfirm={onConfirm} />);

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  test('should call onCancel when cancel button is clicked', () => {
    const onCancel = mock(() => {});
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('should call onCancel when backdrop is clicked', () => {
    const onCancel = mock(() => {});
    const { container } = render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    // The backdrop is the outermost div with the fixed positioning
    const backdrop = container.querySelector('.fixed');
    fireEvent.click(backdrop!);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('should call onCancel when Escape key is pressed', () => {
    const onCancel = mock(() => {});
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test('should display loading text when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);

    expect(screen.getByRole('button', { name: 'Processing...' })).toBeInTheDocument();
  });

  test('should disable buttons when loading', () => {
    render(<ConfirmModal {...defaultProps} loading={true} />);

    const confirmButton = screen.getByRole('button', { name: 'Processing...' });
    const cancelButton = screen.getByRole('button', { name: 'Cancel' });

    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  test('should not call onCancel when backdrop is clicked while loading', () => {
    const onCancel = mock(() => {});
    const { container } = render(<ConfirmModal {...defaultProps} onCancel={onCancel} loading={true} />);

    const backdrop = container.querySelector('.fixed');
    fireEvent.click(backdrop!);

    expect(onCancel).not.toHaveBeenCalled();
  });

  test('should not call onCancel when Escape is pressed while loading', () => {
    const onCancel = mock(() => {});
    render(<ConfirmModal {...defaultProps} onCancel={onCancel} loading={true} />);

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(onCancel).not.toHaveBeenCalled();
  });

  test('should have proper dialog role and aria attributes', () => {
    render(<ConfirmModal {...defaultProps} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-modal-title');
  });
});
