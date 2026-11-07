import { buildRules } from '@/lib/constants';
import { PenaltyOption } from '@/lib/api';
import { PENALTY_EMOJI_MAP, PenaltyType, RouteHole } from '@/lib/types';

export function RulesList({ holes }: { holes: RouteHole[] }) {
  const rules = buildRules(holes.length > 0 ? Object.keys(holes[0].drinks) : []);
  return (
    <ol className="space-y-3 mb-6">
      {rules.map((rule, index) => (
        <li key={rule} className="flex gap-2.5 text-[13.5px] leading-normal text-[var(--color-text-secondary)]">
          <span className="font-display text-sm text-[var(--color-primary)]">{index + 1}</span>
          <span>{rule}</span>
        </li>
      ))}
    </ol>
  );
}

export function PenaltiesList({ penalties }: { penalties: PenaltyOption[] }) {
  return (
    <div className="flex flex-col gap-2">
      {penalties.map((penalty) => (
        <div key={penalty.type} className="flex items-center justify-between surface-danger rounded-xl px-3.5 py-3 text-sm">
          <span className="text-[var(--color-danger-text)] text-[13.5px]">
            <span className="mr-2" role="img" aria-hidden="true">
              {PENALTY_EMOJI_MAP[penalty.type as PenaltyType]}
            </span>
            {penalty.name}
          </span>
          <span className="font-display text-[15px] text-[var(--color-error)]">+{penalty.points}</span>
        </div>
      ))}
    </div>
  );
}
