'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Typography } from './ui/Typography';
import { modalVariants, overlayVariants } from '@/lib/animations';

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
    const link = getShareLink();
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };
    try {
      await navigator.clipboard.writeText(link);
      markCopied();
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (success) markCopied();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-[rgba(13,20,16,0.85)] backdrop-blur-sm flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={overlayVariants}
    >
      <motion.div
        variants={modalVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full max-w-sm mx-4"
      >
        <Card
          ref={modalRef}
          rounded="lg"
          padding="lg"
          className="w-full space-y-5"
        >
        <Typography variant="title" as="h2" id="share-modal-title" className="text-center">
          Rally Your Crew
        </Typography>

        <div className="flex justify-center">
          <div className="bg-[var(--color-text)] p-[18px] rounded-[20px] shadow-[0_0_40px_rgba(201,162,75,0.25)]">
            <QRCode
              size={180}
              value={getShareLink()}
              style={{ height: 'auto', maxWidth: '100%', width: '100%' }}
              viewBox="0 0 180 180"
              bgColor="#f4ead9"
              fgColor="#1c1404"
            />
          </div>
        </div>

        <div className="flex flex-col items-center space-y-1">
          <p className="eyebrow text-[var(--color-text-muted)]">Game Code</p>
          <p className="font-display text-4xl tracking-[0.08em] text-[var(--color-accent)]">
            {gameCode.toUpperCase()}
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handleCopy}
            ariaLabel={copied ? 'Link copied to clipboard' : 'Copy invite link to clipboard'}
            size="lg"
            className="w-full"
          >
            {copied ? 'COPIED!' : 'COPY INVITE LINK'}
          </Button>
          <Button
            ref={closeButtonRef}
            onClick={onClose}
            variant="secondary"
            ariaLabel="Close share modal"
            className="w-full font-bold"
          >
            Done
          </Button>
        </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
