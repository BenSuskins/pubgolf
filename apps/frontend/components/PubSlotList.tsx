'use client';

import { Pub } from '@/lib/types';

interface PubSlotListProps {
  pubs: Pub[];
  onRemove: (index: number) => void;
}

export default function PubSlotList({ pubs, onRemove }: PubSlotListProps) {
  const slots = Array.from({ length: 9 }, (_, i) => i);
  const visibleSlots = Math.min(pubs.length + 1, 9);

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-sm text-gray-700">Pub Route ({pubs.length}/9)</h3>
      <ul className="space-y-1" aria-label="Selected pubs">
        {slots.slice(0, visibleSlots).map((index) => {
          const pub = pubs[index];
          const isFilled = pub !== undefined;
          const isLastFilled = isFilled && index === pubs.length - 1;

          return (
            <li
              key={index}
              className={`flex items-center gap-3 p-2 rounded-md ${
                isFilled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-500 text-white rounded-full text-sm font-bold">
                {index + 1}
              </span>
              {isFilled ? (
                <>
                  <span className="flex-1 truncate text-sm font-medium">{pub.name}</span>
                  {isLastFilled && (
                    <button
                      onClick={() => onRemove(index)}
                      className="flex-shrink-0 px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                      aria-label={`Remove ${pub.name}`}
                    >
                      Remove
                    </button>
                  )}
                </>
              ) : (
                <span className="flex-1 text-sm text-gray-400 italic">Empty slot</span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
