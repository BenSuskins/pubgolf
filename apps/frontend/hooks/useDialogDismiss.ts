'use client';

import { useEffect, useRef, type RefObject } from 'react';

// Anything that can take focus inside a dialog. Disabled buttons are skipped so a
// loading confirm button never traps the cycle on itself.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Fields that pop the on-screen keyboard the moment they take focus. A dialog never
// auto-focuses one - on a phone that covers half the sheet before the user has decided
// to type - so focus lands on the dialog surface instead and typing starts on a tap.
const TEXT_ENTRY_SELECTOR =
  'textarea, input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])';

interface UseDialogDismissOptions {
  /** Called on Escape and on a click that lands on the backdrop itself. */
  onDismiss: () => void;
  /** While true, Escape and backdrop clicks are ignored - e.g. a save is in flight. */
  locked?: boolean;
  /** Focused when the dialog mounts. Falls back to the first focusable element. */
  initialFocusRef?: RefObject<HTMLElement | null>;
}

interface UseDialogDismissResult<Container extends HTMLElement> {
  /** Put this on the dialog surface - it bounds the focus trap. */
  containerRef: RefObject<Container | null>;
  /** Put this on the backdrop's onClick. */
  onBackdropClick: (event: React.MouseEvent) => void;
}

/**
 * Escape-to-dismiss, backdrop-to-dismiss and a Tab focus trap - the behaviour every
 * modal surface in the app needs. Shared by ConfirmModal, ShareModal and BottomSheet.
 */
export function useDialogDismiss<Container extends HTMLElement = HTMLDivElement>({
  onDismiss,
  locked = false,
  initialFocusRef,
}: UseDialogDismissOptions): UseDialogDismissResult<Container> {
  const containerRef = useRef<Container>(null);

  // Mount only: re-running this on every render would yank focus back out of whatever
  // the user is typing in, since callers pass inline `onDismiss` closures.
  useEffect(() => {
    const firstFocusable = containerRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);

    if (initialFocusRef?.current) {
      initialFocusRef.current.focus();
    } else if (firstFocusable && !firstFocusable.matches(TEXT_ENTRY_SELECTOR)) {
      firstFocusable.focus();
    } else {
      // Needs tabindex="-1" on the surface, which every dialog here sets.
      containerRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const focusables = () =>
      Array.from(containerRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (!locked) onDismiss();
        return;
      }

      if (event.key !== 'Tab') return;

      const elements = focusables();
      const first = elements[0];
      const last = elements[elements.length - 1];

      // Shift+Tab off the surface itself wraps to the end, same as off the first element.
      const atStart =
        document.activeElement === first || document.activeElement === containerRef.current;

      if (event.shiftKey && atStart) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss, locked]);

  const onBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !locked) {
      onDismiss();
    }
  };

  return { containerRef, onBackdropClick };
}
