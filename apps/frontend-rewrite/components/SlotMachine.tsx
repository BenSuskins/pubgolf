'use client';

import { useEffect, useRef } from 'react';

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
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const offsetRef = useRef(0);
  const hasSpunRef = useRef(false);
  const itemWidth = 120;

  // Create repeated items for looping effect
  const repeatedItems = [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items];
  const totalWidth = items.length * itemWidth;

  // Idle animation - continuous scroll
  useEffect(() => {
    if (spinning || hasSpunRef.current || items.length === 0) return;

    const animate = () => {
      offsetRef.current += 2; // Speed of idle scroll
      // Reset when we've scrolled through one set of items
      if (offsetRef.current >= totalWidth) {
        offsetRef.current = 0;
      }

      if (containerRef.current) {
        containerRef.current.style.transform = `translateX(calc(50% - ${offsetRef.current + itemWidth / 2}px))`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinning, items.length, totalWidth]);

  // Handle spinning to winning index
  useEffect(() => {
    if (!spinning || winningIndex === null) return;

    // Stop idle animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Calculate target offset - must be done inside effect to access ref
    const targetForWinningItem = winningIndex * itemWidth;
    const minLoops = 3;
    const minDistanceToTravel = totalWidth * minLoops;
    const currentOffset = offsetRef.current;
    const minFinalOffset = currentOffset + minDistanceToTravel;
    const loopsNeeded = Math.ceil((minFinalOffset - targetForWinningItem) / totalWidth);
    const targetOffset = targetForWinningItem + loopsNeeded * totalWidth;

    // Apply the target offset with transition
    offsetRef.current = targetOffset;
    if (containerRef.current) {
      containerRef.current.style.transition = `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      containerRef.current.style.transform = `translateX(calc(50% - ${targetOffset + itemWidth / 2}px))`;
    }

    // Call onSpinEnd after animation completes
    const timer = setTimeout(() => {
      hasSpunRef.current = true;
      if (containerRef.current) {
        containerRef.current.style.transition = 'none';
      }
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
          transform: `translateX(calc(50% - ${itemWidth / 2}px))`,
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
