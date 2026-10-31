import React, { useState } from 'react';
import { ArrowRight, Car, Search } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

interface HeroBannerProps {
  onNavigateToBuy?: (query?: string) => void;
  onNavigateToSell?: (carPhrase?: string) => void;
  onNavigateToShowroom?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigateToBuy, onNavigateToSell, onNavigateToShowroom }) => {
  const [activeTab, setActiveTab] = useState<'find' | 'sell'>('find');
  const [carPhrase, setCarPhrase] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const cms = useCmsContent();
  const heroBanner = cms?.banners.find((banner) => banner.slot === 'hero_callout');

  const handleFindSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onNavigateToBuy?.(searchQuery.trim());
  };

  const handleSellSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onNavigateToSell?.(carPhrase.trim());
  };

  return (
    <section className="relative overflow-hidden border-b border-neutral-800 bg-[#111111] pb-14 pt-8 text-white">
      <div className="pointer-events-none absolute inset-0 select-none">
        {heroBanner?.imageUrl && (
          <img
            src={heroBanner.imageUrl}
            alt=""
            className="h-full w-full scale-105 object-cover object-center brightness-[0.32] contrast-[1.1]"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/60 to-[#111111]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.65)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 text-center sm:px-6">
        <h1 className="mb-2 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl md:text-4xl">Buy or sell a car in Zambia</h1>
        <p className="mb-6 text-sm font-medium text-neutral-300">Browse published listings or send us a vehicle request.</p>
        {heroBanner && (
          <a href={heroBanner.linkUrl || '/showroom'} className="group mb-8 inline-flex items-center justify-center gap-3 hover:opacity-95">
            <div>
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-xl font-extrabold uppercase tracking-tight sm:text-2xl">{heroBanner.title}</h2>
                <span className="flex size-8 items-center justify-center rounded-full bg-[#8574ff] text-neutral-950 transition-transform group-hover:translate-x-1">
                  <ArrowRight className="size-4 stroke-[2.5]" />
                </span>
              </div>
              {heroBanner.body && <p className="mt-1 text-xs font-medium text-neutral-300 sm:text-sm">{heroBanner.body}</p>}
            </div>
          </a>
        )}

        <div className="mx-auto max-w-[660px] rounded-2xl border border-neutral-700/60 bg-[#222222]/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          <div className="mb-4 flex items-center justify-center gap-6 border-b border-neutral-700/50 pb-4 sm:gap-8" role="tablist" aria-label="Vehicle requests">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'find'}
              onClick={() => setActiveTab('find')}
              className={`relative cursor-pointer pb-1 text-sm font-bold transition-colors sm:text-[15px] ${activeTab === 'find' ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#8574ff]' : 'text-neutral-400 hover:text-white'}`}
            >
              Find a car
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'sell'}
              onClick={() => setActiveTab('sell')}
              className={`relative cursor-pointer pb-1 text-sm font-bold transition-colors sm:text-[15px] ${activeTab === 'sell' ? 'text-white after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#8574ff]' : 'text-neutral-400 hover:text-white'}`}
            >
              Sell a car
            </button>
          </div>

          {activeTab === 'find' ? (
            <form onSubmit={handleFindSubmit} className="space-y-3 text-left">
              <label htmlFor="vehicle-search" className="block text-xs font-bold text-neutral-200 sm:text-sm">What vehicle are you looking for?</label>
              <div className="relative flex items-center">
                <input
                  id="vehicle-search"
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Make or model"
                  className="w-full rounded-lg bg-white py-3.5 pl-4 pr-12 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-[#8574ff] sm:text-base"
                />
                <button type="submit" className="absolute right-1.5 rounded-md bg-[#8574ff] p-2 text-neutral-950 transition-colors hover:bg-[#7360f2]" title="Send a vehicle request" aria-label="Send a vehicle request">
                  <Search className="size-5 stroke-[2.5]" />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-neutral-300 sm:text-sm">
                <span>Looking for a listed vehicle?</span>
                <button type="button" onClick={onNavigateToShowroom} className="cursor-pointer font-bold text-white underline underline-offset-4 hover:text-[#8574ff]">Open the showroom</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSellSubmit} className="space-y-3 text-left">
              <label htmlFor="vehicle-for-sale" className="block text-xs font-bold text-neutral-200 sm:text-sm">What vehicle are you selling?</label>
              <div className="flex flex-col items-stretch gap-2.5 sm:flex-row">
                <div className="relative flex flex-1 items-center overflow-hidden rounded-lg bg-white shadow-inner focus-within:ring-2 focus-within:ring-[#8574ff]">
                  <Car className="ml-3 size-4 shrink-0 text-[#8574ff]" />
                  <input
                    id="vehicle-for-sale"
                    type="text"
                    value={carPhrase}
                    onChange={(event) => setCarPhrase(event.target.value)}
                    placeholder="Make, model and year"
                    className="w-full bg-white px-3.5 py-3 text-base font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-neutral-400 sm:text-lg"
                  />
                </div>
                <button type="submit" className="cursor-pointer whitespace-nowrap rounded-lg bg-[#8574ff] px-6 py-3 text-sm font-black text-neutral-950 shadow-md transition-colors hover:bg-[#7360f2] sm:text-base">Continue</button>
              </div>
              <p className="text-center text-xs text-neutral-400 sm:text-left">Share the vehicle details and contact information for review.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
