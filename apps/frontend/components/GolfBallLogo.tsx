export interface GolfBallLogoProps {
  size?: number;
  className?: string;
}

export function GolfBallLogo({ size = 72, className = '' }: GolfBallLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      className={className}
      role="img"
      aria-label="Pub Golf logo"
    >
      <circle cx="36" cy="36" r="34" fill="var(--color-text)" stroke="var(--color-primary)" strokeWidth="2" />
      <g fill="var(--color-bg)" opacity="0.55">
        <circle cx="26" cy="24" r="2.4" />
        <circle cx="40" cy="20" r="2.4" />
        <circle cx="50" cy="30" r="2.4" />
        <circle cx="22" cy="38" r="2.4" />
        <circle cx="46" cy="44" r="2.4" />
        <circle cx="32" cy="50" r="2.4" />
        <circle cx="54" cy="46" r="2.4" />
        <circle cx="36" cy="36" r="2.4" />
      </g>
    </svg>
  );
}
