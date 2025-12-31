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
    <ul className="space-y-2">
      {holes.map((hole) => {
        const drinkName = Object.values(hole.drinks)[0];
        return (
          <li
            key={hole.hole}
            className="flex items-center justify-between py-2 border-b border-[var(--color-border-subtle)]"
          >
            <div className="flex items-center gap-3">
              <span className="text-[var(--color-accent)] font-bold font-mono w-6">
                {hole.hole}.
              </span>
              <span>{drinkName}</span>
            </div>
            <span className="font-medium text-[var(--color-text-secondary)]">
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
    <div className="overflow-x-auto -mx-2">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-border)]">
            <th className="px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]">
              Hole
            </th>
            {routeNames.map((name) => (
              <th
                key={name}
                className="px-3 py-3 text-left font-semibold text-[var(--color-text-secondary)]"
              >
                {name}
              </th>
            ))}
            <th className="px-3 py-3 text-center font-semibold text-[var(--color-accent)]">
              Par
            </th>
          </tr>
        </thead>
        <tbody>
          {holes.map((hole) => (
            <tr
              key={hole.hole}
              className="border-b border-[var(--color-border-subtle)] hover:bg-white/5 transition-colors"
            >
              <td className="px-3 py-3 font-bold text-[var(--color-accent)]">
                {hole.hole}
              </td>
              {routeNames.map((name) => (
                <td key={name} className="px-3 py-3">
                  {hole.drinks[name]}
                </td>
              ))}
              <td className="px-3 py-3 text-center font-medium">{hole.par}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
