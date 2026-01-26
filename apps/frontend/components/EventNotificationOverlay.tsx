'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ActiveEvent } from '@/lib/types';
import { Typography } from './ui/Typography';
import { overlayVariants, slideFromTopVariants, fadeInVariants } from '@/lib/animations';

interface EventNotificationOverlayProps {
  event: ActiveEvent;
  onDismiss: () => void;
}

export function EventNotificationOverlay({ event, onDismiss }: EventNotificationOverlayProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = () => {
    onDismiss();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      onDismiss();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Tap to dismiss"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={overlayVariants}
    >
      <motion.div
        className="text-center space-y-4 p-8 max-w-md"
        variants={slideFromTopVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        <motion.div
          className="text-6xl"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          📣
        </motion.div>

        <div className="space-y-2">
          <Typography variant="display" as="h1" color="accent" className="text-3xl">
            {event.title}
          </Typography>
          <Typography variant="subheading" color="secondary">
            {event.description}
          </Typography>
        </div>

        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <Typography variant="small" color="secondary" className="animate-pulse">
            Tap anywhere to dismiss
          </Typography>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
