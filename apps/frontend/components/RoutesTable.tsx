import type { RouteHole } from '@/lib/types';

interface RoutesTableProps {
  holes: RouteHole[];
}

export function RoutesTable({ holes }: RoutesTableProps) {
  if (holes.length === 0) {
    return null;
  }

  const routeNames = Object.keys(holes[0].drinks);
  const isSingleRoute = routeNames.length === 1;

  if (isSingleRoute) {
    return <SingleRouteList holes={holes} />;
  }

  return <MultiRouteTable holes={holes} routeNames={routeNames} />;
}

function SingleRouteList({ holes }: { holes: RouteHole[] }) {
  return (
    <ul className="space-y-0">
      {holes.map((hole) => {
        const drinkName = Object.values(hole.drinks)[0];
        return (
          <li
            key={hole.hole}
            className="flex items-center justify-between py-2.5 border-b border-[var(--color-border-subtle)]/50 last:border-b-0"
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-[var(--color-primary)] w-5">
                {hole.hole}
              </span>
              <span className="text-[12.5px] text-[var(--color-text-secondary)]">{drinkName}</span>
            </div>
            <span className="text-[12.5px] font-medium text-[var(--color-accent)]">
              Par {hole.par}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function MultiRouteTable({
  holes,
  routeNames,
}: {
  holes: RouteHole[];
  routeNames: string[];
}) {
  return (
    <div className="overflow-x-auto -mx-2 px-2">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="pr-2 pb-2 text-left eyebrow font-semibold text-[var(--color-text-muted)]">
              #
            </th>
            {routeNames.map((name) => (
              <th
                key={name}
                className="px-2 pb-2 text-left eyebrow text-[var(--color-text-muted)]"
              >
                {name}
              </th>
            ))}
            <th className="pl-2 pb-2 text-right eyebrow text-[var(--color-accent)]">
              Par
            </th>
          </tr>
        </thead>
        <tbody>
          {holes.map((hole) => (
            <tr
              key={hole.hole}
              className="border-b border-[var(--color-border-subtle)]/50 last:border-b-0"
            >
              <td className="pr-2 py-2.5 font-display text-[var(--color-primary)]">
                {hole.hole}
              </td>
              {routeNames.map((name) => (
                <td key={name} className="px-2 py-2.5 text-[12.5px] text-[var(--color-text-secondary)]">
                  {hole.drinks[name]}
                </td>
              ))}
              <td className="pl-2 py-2.5 text-right text-[12.5px] text-[var(--color-accent)]">{hole.par}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
