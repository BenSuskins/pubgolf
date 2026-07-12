export interface SegmentedControlOption<Value extends string> {
  value: Value;
  label: string;
}

export interface SegmentedControlProps<Value extends string> {
  options: SegmentedControlOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
  ariaLabel: string;
}

export function SegmentedControl<Value extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: SegmentedControlProps<Value>) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="surface-inset rounded-2xl p-[5px] flex gap-1"
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isActive}
            className={`flex-1 text-center py-3 rounded-xl font-bold text-sm transition-colors ${
              isActive
                ? 'bg-[var(--color-primary)] text-[var(--color-ink)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
