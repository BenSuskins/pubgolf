'use client';

import { motion } from 'framer-motion';
import { Player } from '@/lib/types';
import { Typography } from './ui/Typography';
import { overlayVariants, celebrationVariants, fadeInVariants } from '@/lib/animations';

interface CelebrationScreenProps {
  winners: Player[];
  onDismiss: () => void;
}

export function CelebrationScreen({ winners, onDismiss }: CelebrationScreenProps) {
  const handleClick = () => {
    onDismiss();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      onDismiss();
    }
  };

  const winnerNames = winners.map(w => w.name).join(' & ');
  const isTie = winners.length > 1;

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label="Tap to view full results"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={overlayVariants}
    >
      <div className="text-center space-y-6 p-8">
        <motion.div
          className="text-8xl"
          variants={celebrationVariants}
          initial="initial"
          animate="animate"
        >
          🏆
        </motion.div>

        <motion.div
          className="space-y-2"
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <Typography variant="subheading" color="secondary">
            {isTie ? 'Winners' : 'Winner'}
          </Typography>
          <Typography variant="display" as="h1" color="accent" className="text-4xl">
            {winnerNames}
          </Typography>
          {winners.length > 0 && (
            <Typography variant="title" className="text-2xl">
              {winners[0].totalScore} sips
            </Typography>
          )}
        </motion.div>

        <motion.div
          variants={fadeInVariants}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.5 }}
        >
          <Typography variant="small" color="secondary" className="animate-pulse">
            Tap anywhere to view results
          </Typography>
        </motion.div>
      </div>
    </motion.div>
  );
}
