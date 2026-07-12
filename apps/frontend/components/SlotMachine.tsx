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

  const repeatedItems = [...items, ...items, ...items, ...items, ...items, ...items, ...items, ...items];
  const totalWidth = items.length * itemWidth;

  useEffect(() => {
    if (spinning || hasSpunRef.current || items.length === 0) return;

    const animate = () => {
      offsetRef.current += 2;
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

  useEffect(() => {
    if (!spinning || winningIndex === null) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const targetForWinningItem = winningIndex * itemWidth;
    const minLoops = 3;
    const minDistanceToTravel = totalWidth * minLoops;
    const currentOffset = offsetRef.current;
    const minFinalOffset = currentOffset + minDistanceToTravel;
    const loopsNeeded = Math.ceil((minFinalOffset - targetForWinningItem) / totalWidth);
    const targetOffset = targetForWinningItem + loopsNeeded * totalWidth;

    offsetRef.current = targetOffset;
    if (containerRef.current) {
      containerRef.current.style.transition = `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      containerRef.current.style.transform = `translateX(calc(50% - ${targetOffset + itemWidth / 2}px))`;
    }

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
    <div
      className="relative w-full overflow-hidden rounded-xl pt-4"
      role="region"
      aria-label="Wildcard wheel"
      aria-live="polite"
    >
      {/* Gradient fades */}
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--color-surface)] to-transparent z-10 pointer-events-none" aria-hidden="true" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--color-surface)] to-transparent z-10 pointer-events-none" aria-hidden="true" />

      {/* Gold pointer marking the selected card */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 z-20 pointer-events-none w-0 h-0 border-l-8 border-r-8 border-t-[12px] border-l-transparent border-r-transparent border-t-[var(--color-accent)]"
        aria-hidden="true"
      />

      <div
        ref={containerRef}
        className="flex py-3"
        role="list"
        aria-label="Wheel options"
        style={{
          transform: `translateX(calc(50% - ${itemWidth / 2}px))`,
        }}
      >
        {repeatedItems.map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 flex items-center justify-center px-1"
            style={{ width: itemWidth }}
            role="listitem"
          >
            <div className="w-full h-20 flex items-center justify-center bg-[var(--color-bg)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] font-semibold text-[12.5px] rounded-[14px] px-3 text-center leading-tight">
              {item}
            </div>
          </div>
        ))}
      </div>
      {spinning && (
        <div className="sr-only" role="status" aria-live="assertive">
          Spinning wheel...
        </div>
      )}
    </div>
  );
}
