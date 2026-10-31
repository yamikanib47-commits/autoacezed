import React from 'react';
import { Car, Search, Tag } from 'lucide-react';

interface CategoryChipsProps {
  onNavigateToShowroom?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
}

const actions = [
  { label: 'Browse listed cars', icon: Car, key: 'showroom' },
  { label: 'Request a car', icon: Search, key: 'buy' },
  { label: 'Sell your car', icon: Tag, key: 'sell' },
] as const;

export const CategoryChips: React.FC<CategoryChipsProps> = ({ onNavigateToShowroom, onNavigateToBuy, onNavigateToSell }) => {
  const handlers = { showroom: onNavigateToShowroom, buy: onNavigateToBuy, sell: onNavigateToSell };

  return (
    <nav aria-label="Quick actions" className="mx-auto flex max-w-[1280px] flex-wrap justify-center gap-3 px-4 py-6 sm:px-6">
      {actions.map(({ label, icon: Icon, key }) => (
        <button
          key={key}
          type="button"
          onClick={handlers[key]}
          className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition-colors hover:border-[#8574ff] hover:bg-[#f6f4ff]"
        >
          <Icon className="size-4 text-[#6852f5]" aria-hidden="true" />
          {label}
        </button>
      ))}
    </nav>
  );
};
