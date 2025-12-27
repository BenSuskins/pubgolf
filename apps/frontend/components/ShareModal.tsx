'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';

interface ShareModalProps {
  gameCode: string;
  onClose: () => void;
}

export function ShareModal({ gameCode, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const getShareLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}?gameCode=${gameCode.toUpperCase()}`;
    }
    return '';
  };

  useEffect(() => {
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = getShareLink();
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-[var(--color-surface)] rounded-lg p-6 max-w-sm w-full mx-4 space-y-4"
      >
        <h2 id="share-modal-title" className="text-xl font-bold text-center">
          Share Game
        </h2>

        <div className="flex justify-center">
          <div className="bg-white p-3 rounded-lg">
            <QRCode
              size={200}
              value={getShareLink()}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 200 200"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">Game Code</p>
          <p className="text-2xl font-bold tracking-wider">{gameCode.toUpperCase()}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            aria-label={copied ? 'Link copied to clipboard' : 'Copy invite link to clipboard'}
            className="w-full py-2 px-4 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white font-medium rounded-md transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close share modal"
            className="w-full py-2 px-4 border border-[var(--color-border)] font-medium rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
