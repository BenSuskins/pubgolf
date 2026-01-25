'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'react-qr-code';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';

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
      <Card
        ref={modalRef}
        rounded="lg"
        padding="lg"
        className="max-w-sm w-full mx-4 space-y-5 animate-fade-in"
      >
        <Typography variant="heading" as="h2" id="share-modal-title" className="text-center">
          Rally Your Crew
        </Typography>

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

        <div className="flex flex-col items-center space-y-1">
          <p className="text-sm text-[var(--color-text-secondary)]">Game Code</p>
          <p className="text-4xl font-bold tracking-widest font-mono text-[var(--color-accent)]">
            {gameCode.toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCopy}
            ariaLabel={copied ? 'Link copied to clipboard' : 'Copy invite link to clipboard'}
            className="w-full"
          >
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </Button>
          <Button
            ref={closeButtonRef}
            onClick={onClose}
            variant="secondary"
            ariaLabel="Close share modal"
            className="w-full"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
}
