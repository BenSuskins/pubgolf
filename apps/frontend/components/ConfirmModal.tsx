'use client';

import { useRef } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { useDialogDismiss } from '@/hooks/useDialogDismiss';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const { containerRef, onBackdropClick } = useDialogDismiss({
    onDismiss: onCancel,
    locked: loading,
    initialFocusRef: cancelButtonRef,
  });

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <Card
        ref={containerRef}
        rounded="lg"
        padding="lg"
        className="max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <Typography variant="heading" as="h2" id="confirm-modal-title" className="text-center">
          {title}
        </Typography>

        <Typography as="p" color="secondary" className="text-center">
          {message}
        </Typography>

        <div className="space-y-3">
          <Button
            onClick={onConfirm}
            disabled={loading}
            loading={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : confirmText}
          </Button>
          <Button
            ref={cancelButtonRef}
            onClick={onCancel}
            disabled={loading}
            variant="secondary"
            className="w-full"
          >
            {cancelText}
          </Button>
        </div>
      </Card>
    </div>
  );
}
