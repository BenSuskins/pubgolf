'use client';

import { useEffect, useMemo, useRef } from 'react';
import type { WheelOption } from '@/lib/api';

interface SpinWheelProps {
  options: WheelOption[];
  winningOption: string | null;
  spinning: boolean;
  onSpinEnd: () => void;
  spinDuration?: number;
}

export interface Wedge {
  option: string;
  startAngle: number;
  endAngle: number;
  midAngle: number;
}

// Angles are degrees clockwise from 12 o'clock (where the pointer sits).
// Each wedge's arc is proportional to its server weight, so the wheel's
// geometry matches the real odds of the draw.
export function computeWedges(options: WheelOption[]): Wedge[] {
  const weights = options.map((opt) => Math.max(1, opt.optionSize ?? 1));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let cursor = 0;
  return options.map((opt, i) => {
    const angle = (weights[i] / totalWeight) * 360;
    const wedge = {
      option: opt.option,
      startAngle: cursor,
      endAngle: cursor + angle,
      midAngle: cursor + angle / 2,
    };
    cursor += angle;
    return wedge;
  });
}

const SIZE = 400;
const CENTER = SIZE / 2;
const RADIUS = 192;
const LABEL_OUTER_RADIUS = 182;
const HUB_RADIUS = 26;

const WEDGE_FILLS = [
  'var(--color-wheel-wedge-1)',
  'var(--color-wheel-wedge-2)',
  'var(--color-wheel-wedge-3)',
  'var(--color-wheel-wedge-4)',
];

// Cycle fills per wedge; if the last wedge would match the first (they sit
// next to each other on the circle), swap it for a fill that also differs
// from its other neighbour.
function wedgeFill(index: number, count: number): string {
  const cycled = index % WEDGE_FILLS.length;
  if (index === count - 1 && cycled === 0 && count > 2) {
    const previous = (index - 1) % WEDGE_FILLS.length;
    return WEDGE_FILLS[previous === 2 ? 1 : 2];
  }
  return WEDGE_FILLS[cycled];
}

function polar(angle: number, radius: number): { x: number; y: number } {
  const rad = (angle * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.sin(rad),
    y: CENTER - radius * Math.cos(rad),
  };
}

function wedgePath(wedge: Wedge): string {
  const start = polar(wedge.startAngle, RADIUS);
  const end = polar(wedge.endAngle, RADIUS);
  const largeArc = wedge.endAngle - wedge.startAngle > 180 ? 1 : 0;
  return `M ${CENTER} ${CENTER} L ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function SpinWheel({
  options,
  winningOption,
  spinning,
  onSpinEnd,
  spinDuration = 3,
}: SpinWheelProps) {
  const wheelRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const hasSpunRef = useRef(false);

  const wedges = useMemo(() => computeWedges(options), [options]);

  useEffect(() => {
    if (spinning || hasSpunRef.current || options.length === 0) return;
    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const animate = () => {
      rotationRef.current = (rotationRef.current + 0.05) % 360;

      if (wheelRef.current) {
        wheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [spinning, options.length]);

  useEffect(() => {
    if (!spinning || winningOption === null) return;

    const wedge = wedges.find((w) => w.option === winningOption);
    if (!wedge) return;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // A wedge at angle a (clockwise from the pointer) sits under the pointer
    // when the wheel rotation R satisfies (a + R) % 360 === 0. Land within the
    // middle 80% of the wedge rather than dead-centre every time.
    const wedgeAngle = wedge.endAngle - wedge.startAngle;
    const jitter = (Math.random() - 0.5) * wedgeAngle * 0.8;
    const landingAngle = wedge.midAngle + jitter;
    const minLoops = 3;
    const minRotation = rotationRef.current + minLoops * 360;
    const loopsNeeded = Math.ceil((minRotation + landingAngle) / 360);
    const targetRotation = loopsNeeded * 360 - landingAngle;

    rotationRef.current = targetRotation;
    if (wheelRef.current) {
      wheelRef.current.style.transition = `transform ${spinDuration}s cubic-bezier(0.25, 0.1, 0.25, 1)`;
      wheelRef.current.style.transform = `rotate(${targetRotation}deg)`;
    }

    const timer = setTimeout(() => {
      hasSpunRef.current = true;
      if (wheelRef.current) {
        wheelRef.current.style.transition = 'none';
      }
      onSpinEnd();
    }, spinDuration * 1000);

    return () => clearTimeout(timer);
  }, [spinning, winningOption, wedges, onSpinEnd, spinDuration]);

  return (
    <div
      className="relative w-full"
      role="region"
      aria-label="Wildcard wheel"
      aria-live="polite"
    >
      {/* Gold pointer marking the selected wedge */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 z-20 pointer-events-none w-0 h-0 border-l-[10px] border-r-[10px] border-t-[18px] border-l-transparent border-r-transparent border-t-[var(--color-accent)] drop-shadow-md"
        aria-hidden="true"
      />

      <div ref={wheelRef} className="w-full">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block w-full h-auto"
          role="list"
          aria-label="Wheel options"
        >
          {wedges.map((wedge, index) => {
            const flip = wedge.midAngle > 180;
            const labelPos = polar(wedge.midAngle, LABEL_OUTER_RADIUS);
            const labelRotation = wedge.midAngle - 90 + (flip ? 180 : 0);
            return (
              <g key={wedge.option} role="listitem">
                <path
                  d={wedgePath(wedge)}
                  data-wedge={wedge.option}
                  fill={wedgeFill(index, wedges.length)}
                  stroke="var(--color-bg)"
                  strokeWidth={2}
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  transform={`rotate(${labelRotation} ${labelPos.x} ${labelPos.y})`}
                  textAnchor={flip ? 'start' : 'end'}
                  dominantBaseline="middle"
                  fill="var(--color-text)"
                  fontSize={11.5}
                  fontWeight={600}
                >
                  {wedge.option}
                </text>
              </g>
            );
          })}

          {/* Rim and hub */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="none"
            stroke="var(--color-border-gold)"
            strokeWidth={3}
            aria-hidden="true"
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={HUB_RADIUS}
            fill="var(--color-surface)"
            stroke="var(--color-accent)"
            strokeWidth={3}
            aria-hidden="true"
          />
        </svg>
      </div>

      {spinning && (
        <div className="sr-only" role="status" aria-live="assertive">
          Spinning wheel...
        </div>
      )}
    </div>
  );
}
