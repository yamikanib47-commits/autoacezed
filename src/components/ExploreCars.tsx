import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useCmsVehicles } from '../services/cmsContent';

interface ExploreCarsProps {
  onNavigateToShowroom?: () => void;
}

export const ExploreCars: React.FC<ExploreCarsProps> = ({ onNavigateToShowroom }) => {
  const { vehicles, loaded, available } = useCmsVehicles();

  if (!loaded || !available || vehicles.length === 0) return null;

  const countBy = (key: 'make' | 'bodyStyle') => {
    const counts = new Map<string, number>();
    for (const vehicle of vehicles) {
      const value = vehicle[key].trim();
      if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b));
  };

  const makes = countBy('make');
  const bodyStyles = countBy('bodyStyle');

  return (
    <section className="mx-auto my-12 max-w-[1280px] px-4 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6852f5]">From published listings</p>
          <h2 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">Browse the catalogue</h2>
        </div>
        <button type="button" onClick={onNavigateToShowroom} className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-[#553ee6] hover:text-[#3f2cb8]">
          See all <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-bold text-neutral-900">Makes</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {makes.map(([make, count]) => <span key={make} className="rounded-full bg-neutral-100 px-3 py-2 text-sm text-neutral-800">{make} <span className="ml-1 text-neutral-500">{count}</span></span>)}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-bold text-neutral-900">Body styles</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {bodyStyles.map(([bodyStyle, count]) => <span key={bodyStyle} className="rounded-full bg-neutral-100 px-3 py-2 text-sm text-neutral-800">{bodyStyle} <span className="ml-1 text-neutral-500">{count}</span></span>)}
          </div>
        </div>
      </div>
    </section>
  );
};
