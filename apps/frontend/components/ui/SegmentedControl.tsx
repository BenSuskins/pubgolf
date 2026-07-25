export interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
  /** Small circular badge before the label, e.g. a step number. */
  badge?: string;
  /** Id of the panel this segment controls, for `aria-controls`. */
  controls?: string;
}

export interface SegmentedControlProps<Value extends string> {
  options: SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  ariaLabel: string;
  /** `sm` is the compact host-panel tab bar; `md` is the default page-level control. */
  size?: 'sm' | 'md';
}

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  size = 'md',
}: SegmentedControlProps<Value>) {
  const compact = size === 'sm';

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`surface-inset flex gap-1 ${compact ? 'rounded-[14px] p-1' : 'rounded-2xl p-[5px]'}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            aria-controls={option.controls}
            className={`flex-1 flex items-center justify-center gap-1.5 font-bold transition-colors ${
              compact ? 'rounded-[10px] py-2.5 text-[13px]' : 'rounded-xl py-3 text-sm'
            } ${
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-ink)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {option.badge && (
              <span
                aria-hidden="true"
                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                  isActive ? 'bg-[rgba(28,20,4,0.25)]' : 'bg-[var(--color-border)]'
                }`}
              >
                {option.badge}
              </span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
