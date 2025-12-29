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
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div
        ref={modalRef}
        className="glass rounded-2xl p-6 max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <h2 id="share-modal-title" className="text-xl font-bold text-center font-[family-name:var(--font-display)]">
          Rally Your Crew
        </h2>

        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-xl glow-sm">
            <QRCode
              size={180}
              value={getShareLink()}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 180 180"
              fgColor="#0d1117"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-[var(--color-text-secondary)] mb-1">Game Code</p>
          <p className="text-3xl font-bold tracking-widest font-mono text-[var(--color-accent)]">
            {gameCode.toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleCopy}
            aria-label={copied ? 'Link copied to clipboard' : 'Copy invite link to clipboard'}
            className="w-full py-3 px-4 btn-gradient rounded-lg"
          >
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close share modal"
            className="w-full py-3 px-4 border border-[var(--color-border)] font-medium rounded-lg hover:bg-white/5 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
