import React from 'react';
import { ArrowUpRight, Clock3, DollarSign, Wallet } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';
import type { ShowroomOfferFilter } from '../data/showroomData';

interface BrowseDealsProps {
  onSelectOffer?: (offer: ShowroomOfferFilter) => void;
  onSelectDeal?: (budgetQuery: string) => void;
}

const offers: { id: ShowroomOfferFilter; title: string; detail: string; icon: typeof Clock3 }[] = [
  { id: 'new-stock', title: 'New stock', detail: 'Added in the last 24 hours', icon: Clock3 },
  { id: 'under-100000', title: 'Under K100,000', detail: 'Browse lower-budget cars', icon: DollarSign },
  { id: 'under-150000', title: 'Under K150,000', detail: 'More room to choose', icon: DollarSign },
  { id: 'over-250000', title: 'K250,000+', detail: 'Explore higher-spec cars', icon: Wallet },
  { id: 'open-budget', title: 'Open budget', detail: 'See every published listing', icon: ArrowUpRight },
];

export const BrowseDeals: React.FC<BrowseDealsProps> = ({ onSelectOffer, onSelectDeal }) => {
  const cms = useCmsContent();
  const deals = cms?.deals ?? [];

  return (
    <section id="browse" className="mx-auto my-8 max-w-[1280px] px-4 sm:my-12 sm:px-6">
      <h2 className="mb-6 text-center font-sans text-2xl font-black uppercase tracking-tight text-neutral-900 sm:text-3xl">Browse offers</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">
        {offers.map((offer) => {
          const Icon = offer.icon;
          return (
            <button
              key={offer.id}
              type="button"
              onClick={() => onSelectOffer?.(offer.id)}
              aria-label={`Browse ${offer.title}: ${offer.detail}`}
              className="group flex min-h-36 w-full cursor-pointer flex-col items-start justify-between rounded-2xl border border-[#ded8cf] bg-[#ece8e2] p-4 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-[#e4dfd7] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f]"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-white/75 text-[#1e3a5f]">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="mt-5 block">
                <span className="block text-sm font-black tracking-tight text-neutral-900 sm:text-base">{offer.title}</span>
                <span className="mt-1 block text-xs font-medium leading-relaxed text-neutral-600">{offer.detail}</span>
              </span>
            </button>
          );
        })}
      </div>
      {deals.length > 0 && (
        <div className="mt-10">
          <h3 className="mb-4 text-center text-lg font-black text-neutral-900">Featured deals</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
            {deals.map((deal) => (
              <button key={deal.id} type="button" onClick={() => onSelectDeal?.(deal.budgetQuery)} className="group flex w-full cursor-pointer flex-col items-center justify-between overflow-hidden rounded-2xl bg-[#ece8e2] p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:bg-[#e4dfd7] hover:shadow-md sm:p-4">
                <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-xl bg-white/40">
                  {deal.imageUrl && <img src={deal.imageUrl} alt={deal.title} loading="lazy" className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105" />}
                </div>
                <h4 className="text-center text-xs font-bold tracking-tight text-neutral-900 group-hover:text-black sm:text-sm">{deal.title}</h4>
                {deal.tag && <span className="mt-2 text-[10px] font-semibold text-neutral-600">{deal.tag}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};
