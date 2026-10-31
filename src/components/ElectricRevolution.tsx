import React from 'react';
import { Car } from 'lucide-react';
import { useCmsVehicles } from '../services/cmsContent';

export const ElectricRevolution: React.FC = () => {
  const { vehicles, loaded, available } = useCmsVehicles();
  const electricVehicles = vehicles.filter((vehicle) => vehicle.fuelType === 'Electric');

  if (!loaded || !available || electricVehicles.length === 0) return null;

  return (
    <section aria-labelledby="electric-listings-title" className="mx-auto my-12 max-w-[1280px] px-4 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6852f5]">Electric vehicles</p>
          <h2 id="electric-listings-title" className="mt-1 text-2xl font-black text-neutral-900 sm:text-3xl">Electric cars listed on Autoace</h2>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {electricVehicles.slice(0, 3).map((vehicle) => (
          <article key={vehicle.id} className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            {vehicle.images[0] ? (
              <img src={vehicle.images[0]} alt={vehicle.name} loading="lazy" className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center bg-neutral-100 text-neutral-400"><Car className="size-12" /></div>
            )}
            <div className="p-4">
              <h3 className="font-extrabold text-neutral-900">{vehicle.name}</h3>
              <p className="mt-1 text-sm text-neutral-600">{[vehicle.year, vehicle.location].filter(Boolean).join(' · ')}</p>
              <p className="mt-3 font-black text-neutral-900">{vehicle.priceZMW > 0 ? `K ${vehicle.priceZMW.toLocaleString()}` : 'Price on request'}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
