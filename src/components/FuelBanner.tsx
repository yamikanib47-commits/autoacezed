import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

export const FuelBanner: React.FC = () => {
  const cms = useCmsContent();
  const banner = cms?.banners.find((item) => item.slot === 'fuel_banner');

  if (!banner) return null;

  return (
    <section className="mx-auto my-6 max-w-[1280px] px-4 md:my-8 sm:px-6">
      <div className="relative grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212] shadow-xl md:grid-cols-12">
        <div className="z-10 flex flex-col justify-between p-6 text-white sm:p-8 lg:p-10 md:col-span-7">
          <div>
            <h2 className="mb-4 font-sans text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">{banner.title}</h2>
            <p className="mb-6 max-w-lg text-base font-medium leading-snug text-neutral-200 sm:text-lg lg:text-xl">{banner.body}</p>
            {banner.linkUrl && <a href={banner.linkUrl} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-black transition-transform hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] sm:px-8 sm:text-base">View details <ArrowRight className="h-4 w-4" /></a>}
          </div>
        </div>
        <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden bg-[#1cdbb4] p-4 sm:min-h-[260px] md:col-span-5 md:min-h-[300px]">
          {banner.imageUrl && <img src={banner.imageUrl} alt={banner.title} loading="lazy" className="h-full w-full rounded-lg object-cover drop-shadow-2xl transition-transform duration-500 hover:scale-105 md:object-contain" />}
        </div>
      </div>
    </section>
  );
};
