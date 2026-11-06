import React, { useState } from 'react';
import { ArrowRight, Car, Search } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

interface HeroBannerProps {
  onNavigateToBuy?: (query?: string) => void;
  onNavigateToSell?: (carPhrase?: string) => void;
  onNavigateToShowroom?: () => void;
  onNavigateToAgent?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ onNavigateToBuy, onNavigateToSell, onNavigateToShowroom, onNavigateToAgent }) => {
  const [activeTab, setActiveTab] = useState<'find' | 'sell'>('find');
  const [carPhrase, setCarPhrase] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const cms = useCmsContent();
  const heroBanner = cms?.banners.find((banner) => banner.slot === 'hero_callout');
  const heroTitle = heroBanner?.title?.trim() || 'Buy or sell a car in Zambia';
  const heroCaption = heroBanner?.body?.trim() || 'Browse published listings or send us a vehicle request.';
  const heroVideo = Boolean(heroBanner?.imageUrl && /\.(mp4|webm)(?:$|[?#])/i.test(heroBanner.imageUrl));

  const handleFindSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onNavigateToBuy?.(searchQuery.trim());
  };

  const handleSellSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onNavigateToSell?.(carPhrase.trim());
  };

  return (
    <section data-home-hero="true" className="relative overflow-hidden border-b border-neutral-800 bg-[#111111] pb-14 pt-24 text-white">
      <div className="pointer-events-none absolute inset-0 select-none">
        {heroBanner?.imageUrl && (heroVideo ? (
          <video
            src={heroBanner.imageUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            className="h-full w-full scale-105 object-cover object-center brightness-[0.65] contrast-[1.05]"
          />
        ) : (
          <img
            src={heroBanner.imageUrl}
            alt=""
            className="h-full w-full scale-105 object-cover object-center brightness-[0.65] contrast-[1.05]"
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/60 via-neutral-950/35 to-[#111111]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.42)_100%)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-4 text-center sm:px-6">
        {heroBanner ? (
          <a href={heroBanner.linkUrl || '/showroom'} className="group mb-6 inline-flex flex-col items-center">
            <span className="inline-flex items-center justify-center gap-2">
              <h1 className="text-2xl font-extrabold uppercase tracking-tight sm:text-3xl md:text-4xl">{heroTitle}</h1>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#bfd1e3] text-[#173b63] transition-transform group-hover:translate-x-1">
                <ArrowRight className="size-4 stroke-[2.5]" aria-hidden="true" />
              </span>
            </span>
            <p className="mt-2 text-sm font-medium text-neutral-300">{heroCaption}</p>
          </a>
        ) : (
          <>
            <h1 className="mb-2 text-2xl font-extrabold uppercase tracking-tight sm:text-3xl md:text-4xl">{heroTitle}</h1>
            <p className="mb-6 text-sm font-medium text-neutral-300">{heroCaption}</p>
          </>
        )}

        <div className="mx-auto max-w-[660px] rounded-2xl border border-neutral-700/60 bg-[#222222]/95 p-4 shadow-2xl backdrop-blur-sm sm:p-6">
          <nav aria-label="Quick actions" className="mb-4 grid grid-cols-3 gap-1 border-b border-neutral-700/50 pb-4">
            <button
              type="button"
              aria-pressed={activeTab === 'find'}
              onClick={() => setActiveTab('find')}
              className={`relative min-h-11 cursor-pointer rounded-lg px-1 py-2 text-[11px] font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bfd1e3] sm:text-sm ${activeTab === 'find' ? 'text-white after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[#bfd1e3]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              Find a car
            </button>
            <button
              type="button"
              aria-pressed={activeTab === 'sell'}
              onClick={() => setActiveTab('sell')}
              className={`relative min-h-11 cursor-pointer rounded-lg px-1 py-2 text-[11px] font-bold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#bfd1e3] sm:text-sm ${activeTab === 'sell' ? 'text-white after:absolute after:bottom-0 after:left-2 after:right-2 after:h-[2px] after:bg-[#bfd1e3]' : 'text-neutral-400 hover:bg-white/5 hover:text-white'}`}
            >
              Sell a car
            </button>
            <a
              href="/agent"
              onClick={(event) => {
                if (onNavigateToAgent) {
                  event.preventDefault();
                  onNavigateToAgent();
                }
              }}
              className="flex min-h-11 items-center justify-center rounded-lg bg-[#bfd1e3] px-1 py-2 text-center text-[11px] font-extrabold leading-tight text-[#173b63] transition-colors hover:bg-[#d7e2ed] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:text-sm"
            >
              Join as an agent
            </a>
          </nav>

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
                  className="w-full rounded-lg bg-white py-3.5 pl-4 pr-12 text-sm font-medium text-neutral-900 outline-none focus:ring-2 focus:ring-[#1e3a5f] sm:text-base"
                />
                <button type="submit" className="absolute right-1.5 rounded-md bg-[#bfd1e3] p-2 text-[#173b63] transition-colors hover:bg-[#d7e2ed]" title="Send a vehicle request" aria-label="Send a vehicle request">
                  <Search className="size-5 stroke-[2.5]" />
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-x-2 text-xs text-neutral-300 sm:text-sm">
                <span>Looking for a listed vehicle?</span>
                <button type="button" onClick={onNavigateToShowroom} className="cursor-pointer font-bold text-white underline underline-offset-4 hover:text-[#bfd1e3]">Open the showroom</button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSellSubmit} className="space-y-3 text-left">
              <label htmlFor="vehicle-for-sale" className="block text-xs font-bold text-neutral-200 sm:text-sm">What vehicle are you selling?</label>
              <div className="flex flex-col items-stretch gap-2.5 sm:flex-row">
                <div className="relative flex flex-1 items-center overflow-hidden rounded-lg bg-white shadow-inner focus-within:ring-2 focus-within:ring-[#1e3a5f]">
                  <Car className="ml-3 size-4 shrink-0 text-[#1e3a5f]" />
                  <input
                    id="vehicle-for-sale"
                    type="text"
                    value={carPhrase}
                    onChange={(event) => setCarPhrase(event.target.value)}
                    placeholder="Make, model and year"
                    className="w-full bg-white px-3.5 py-3 text-base font-bold text-slate-900 outline-none placeholder:font-normal placeholder:text-neutral-400 sm:text-lg"
                  />
                </div>
                <button type="submit" className="cursor-pointer whitespace-nowrap rounded-lg bg-[#bfd1e3] px-6 py-3 text-sm font-black text-[#173b63] shadow-md transition-colors hover:bg-[#d7e2ed] sm:text-base">Continue</button>
              </div>
              <p className="text-center text-xs text-neutral-400 sm:text-left">Share the vehicle details and contact information for review.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};
