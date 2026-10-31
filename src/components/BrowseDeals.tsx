import React from 'react';
import { useCmsContent } from '../services/cmsContent';

interface BrowseDealsProps {
  onSelectDeal?: (budgetQuery: string) => void;
}

export const BrowseDeals: React.FC<BrowseDealsProps> = ({ onSelectDeal }) => {
  const cms = useCmsContent();
  const deals = cms?.deals ?? [];

  if (!deals.length) return null;

  return (
    <section id="browse" className="mx-auto my-8 max-w-[1280px] px-4 sm:my-12 sm:px-6">
      <h2 className="mb-6 text-center font-sans text-2xl font-black uppercase tracking-tight text-neutral-900 sm:text-3xl">Browse offers</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {deals.map((deal) => (
          <button key={deal.id} type="button" onClick={() => onSelectDeal?.(deal.budgetQuery)} className="group flex w-full cursor-pointer flex-col items-center justify-between overflow-hidden rounded-2xl bg-[#ece8e2] p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-[#e4dfd7] hover:shadow-md sm:p-4">
            <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-white/40">
              {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} loading="lazy" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />}
            </div>
            <h3 className="text-center text-xs font-bold tracking-tight text-neutral-900 group-hover:text-black sm:text-sm">{deal.title}</h3>
            {deal.tag && <span className="mt-2 text-[10px] font-semibold text-neutral-600">{deal.tag}</span>}
          </button>
        ))}
      </div>
    </section>
  );
};
