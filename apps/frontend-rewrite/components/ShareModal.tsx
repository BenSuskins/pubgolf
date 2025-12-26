'use client';

import { useState } from 'react';
import QRCode from 'react-qr-code';

interface ShareModalProps {
  gameCode: string;
  onClose: () => void;
}

export function ShareModal({ gameCode, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const getShareLink = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}?gameCode=${gameCode.toUpperCase()}`;
    }
    return '';
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm w-full mx-4 space-y-4">
        <h2 className="text-xl font-bold text-center">Share Game</h2>

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
          <p className="text-sm text-gray-500 dark:text-gray-400">Game Code</p>
          <p className="text-2xl font-bold tracking-wider">{gameCode.toUpperCase()}</p>
        </div>

        <div className="space-y-2">
          <button
            onClick={handleCopy}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Invite Link'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
