import React from 'react';
import { ArrowRight, Car } from 'lucide-react';
import { useCmsVehicles } from '../services/cmsContent';

interface ElectricTrendingProps {
  onNavigateToShowroom?: () => void;
  onNavigateToDeal?: (carId: string) => void;
  onNavigateToBuy?: () => void;
}

export const ElectricTrending: React.FC<ElectricTrendingProps> = ({ onNavigateToShowroom, onNavigateToDeal }) => {
  const { vehicles, loaded, available } = useCmsVehicles();
  const listings = vehicles.slice(0, 6);

  if (!loaded || !available || listings.length === 0) return null;

  return (
    <section aria-labelledby="current-listings-title" className="mx-auto my-10 max-w-[1280px] px-4 sm:my-14 sm:px-6">
      <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-[#6852f5]">Published listings</p>
          <h2 id="current-listings-title" className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">Vehicles available now</h2>
          <p className="mt-1 text-sm text-neutral-600">Details shown are supplied for each listing.</p>
        </div>
        <button type="button" onClick={onNavigateToShowroom} className="inline-flex items-center gap-2 self-start text-sm font-bold text-[#553ee6] hover:text-[#3f2cb8] sm:self-auto">
          Browse all listings <ArrowRight className="size-4" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((car) => (
          <button key={car.id} type="button" onClick={() => onNavigateToDeal?.(car.id)} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white text-left shadow-sm transition-shadow hover:shadow-lg">
            {car.images[0] ? (
              <img src={car.images[0]} alt={car.name} loading="lazy" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-neutral-100 text-neutral-400"><Car className="size-12" aria-hidden="true" /></div>
            )}
            <span className="block p-4">
              <span className="flex items-start justify-between gap-3">
                <span className="font-bold text-neutral-900">{car.name}</span>
                <span className="shrink-0 rounded-full bg-[#f1efff] px-2 py-1 text-[11px] font-semibold text-[#553ee6]">{car.condition}</span>
              </span>
              <span className="mt-1 block text-sm text-neutral-600">{[car.year, car.bodyStyle, car.location].filter(Boolean).join(' · ')}</span>
              <span className="mt-3 block text-lg font-black text-neutral-950">{car.priceZMW > 0 ? `K ${car.priceZMW.toLocaleString()}` : 'Price on request'}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
};
