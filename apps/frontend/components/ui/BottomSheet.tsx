'use client';

import { useId } from 'react';
import { motion } from 'framer-motion';
import { overlayVariants, slideFromBottomVariants } from '@/lib/animations';
import { useDialogDismiss } from '@/hooks/useDialogDismiss';

export interface BottomSheetProps {
  /** Heading shown at the top of the sheet; also labels the dialog. */
  title: string;
  /** Optional explainer under the title. */
  description?: string;
  /** Escape, backdrop click, and any Cancel action in `footer` should call this. */
  onClose: () => void;
  /** While true, Escape and backdrop clicks are ignored - e.g. a save is in flight. */
  locked?: boolean;
  children: React.ReactNode;
  /** Action row pinned under the content, typically Cancel + a primary CTA. */
  footer?: React.ReactNode;
}

/**
 * Sheet that slides up from the bottom of the viewport over a dimmed scrim.
 *
 * Used for the host panel's "create something" flows (Add Route, Custom Event) where a
 * full navigation would feel like leaving the panel. Render it conditionally inside an
 * `AnimatePresence` so the exit animation plays.
 */
export function BottomSheet({
  title,
  description,
  onClose,
  locked = false,
  children,
  footer,
}: BottomSheetProps) {
  const titleId = useId();
  const { containerRef, onBackdropClick } = useDialogDismiss({ onDismiss: onClose, locked });

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end bg-[rgba(0,0,0,0.55)]"
      onClick={onBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={overlayVariants}
    >
      <motion.div
        ref={containerRef}
        variants={slideFromBottomVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-h-[88dvh] overflow-y-auto glass rounded-t-[20px] px-5 pt-5 pb-[calc(26px+env(safe-area-inset-bottom))]"
      >
        <div
          className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--color-border-outline)]"
          aria-hidden="true"
        />

        <h2 id={titleId} className="text-base font-bold text-[var(--color-text)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]">
            {description}
          </p>
        )}

        <div className="mt-4">{children}</div>

        {footer && <div className="mt-[18px] flex gap-2.5">{footer}</div>}
      </motion.div>
    </motion.div>
  );
}
