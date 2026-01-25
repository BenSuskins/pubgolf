'use client';

import { useState } from 'react';

export interface GameCodeDisplayProps {
  gameCode: string;
  size?: 'md' | 'lg';
}

export function GameCodeDisplay({ gameCode, size = 'md' }: GameCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(gameCode.toUpperCase());
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      try {
        const textArea = document.createElement('textarea');
        textArea.value = gameCode.toUpperCase();
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      } catch (fallbackError) {
        // Silently fail - user can still see the code
        console.error('Failed to copy to clipboard:', fallbackError);
      }
    }
  };

  const sizeClasses = size === 'lg' ? 'text-5xl' : 'text-4xl';

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="text-center">
        <p className="text-sm text-[var(--color-text-secondary)] mb-2">Game Code</p>
        <p
          className={`${sizeClasses} font-bold tracking-widest font-mono text-[var(--color-accent)] ${
            copied ? 'animate-pulse-success' : ''
          }`}
        >
          {gameCode.toUpperCase()}
        </p>
      </div>

      <button
        onClick={handleCopy}
        aria-label={copied ? 'Copied game code' : 'Copy game code'}
        className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-[var(--color-border)] hover:bg-white/5 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] focus-visible:outline-offset-2"
      >
        {copied ? (
          <>
            <svg
              className="w-5 h-5 text-[var(--color-success)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-[var(--color-success)] font-medium">Copied!</span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <span className="font-medium">Copy</span>
          </>
        )}
      </button>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {copied && 'Game code copied to clipboard'}
      </div>
    </div>
  );
}
