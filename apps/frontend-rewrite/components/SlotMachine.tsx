'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface SlotMachineProps {
  items: string[];
  winningIndex: number | null;
  spinning: boolean;
  onSpinEnd: () => void;
  spinDuration?: number;
}

export function SlotMachine({
  items,
  winningIndex,
  spinning,
  onSpinEnd,
  spinDuration = 3,
}: SlotMachineProps) {
  const [offset, setOffset] = useState(0);
  const [isIdle, setIsIdle] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const itemWidth = 120;
  const visibleItems = 5;

  // Create repeated items for looping effect
  const repeatedItems = [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items];
  const totalWidth = items.length * itemWidth;

  // Idle animation - continuous scroll
  const idleAnimate = useCallback(() => {
    if (!isIdle) return;

    setOffset((prev) => {
      const next = prev + 2; // Speed of idle scroll
      // Reset when we've scrolled through one set of items
      if (next >= totalWidth) {
        return 0;
      }
      return next;
    });

    animationRef.current = requestAnimationFrame(idleAnimate);
  }, [isIdle, totalWidth]);

  // Start idle animation on mount
  useEffect(() => {
    if (isIdle && items.length > 0) {
      animationRef.current = requestAnimationFrame(idleAnimate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isIdle, idleAnimate, items.length]);

  // Handle spinning to winning index
  useEffect(() => {
    if (!spinning || winningIndex === null) return;

    // Stop idle animation
    setIsIdle(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Calculate final position to land on winning item
    // Account for current position and ensure we spin through multiple loops
    const targetForWinningItem = winningIndex * itemWidth;
    const minLoops = 3;
    const minDistanceToTravel = totalWidth * minLoops;

    // Find finalOffset that lands on winning item and travels at least minLoops
    setOffset((currentOffset) => {
      const minFinalOffset = currentOffset + minDistanceToTravel;
      const loopsNeeded = Math.ceil((minFinalOffset - targetForWinningItem) / totalWidth);
      return targetForWinningItem + loopsNeeded * totalWidth;
    });

    // Call onSpinEnd after animation completes
    const timer = setTimeout(() => {
      onSpinEnd();
    }, spinDuration * 1000);

    return () => clearTimeout(timer);
  }, [spinning, winningIndex, onSpinEnd, spinDuration, totalWidth]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10 pointer-events-none" />

      {/* Center indicator line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -ml-px bg-[var(--color-primary)] z-20 pointer-events-none" />

      {/* Slot container */}
      <div
        ref={containerRef}
        className="flex py-2"
        style={{
          transform: `translateX(calc(50% - ${offset + itemWidth / 2}px))`,
          transition: !isIdle && spinning
            ? `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`
            : 'none',
        }}
      >
        {repeatedItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center justify-center px-2"
            style={{ width: itemWidth }}
          >
            <div className="w-full h-14 flex items-center justify-center bg-[var(--color-primary)] text-white font-medium text-sm rounded-lg px-2 text-center leading-tight">
              {item}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
