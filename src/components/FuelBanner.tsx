import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Pause, Play } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

export const FuelBanner: React.FC = () => {
  const cms = useCmsContent();
  const banners = cms?.banners.filter((item) => item.slot === 'fuel_banner') ?? [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => {
      setReducedMotion(preference.matches);
      setRotationEnabled(!preference.matches);
    };
    updatePreference();
    preference.addEventListener('change', updatePreference);
    return () => preference.removeEventListener('change', updatePreference);
  }, []);

  useEffect(() => {
    setCurrentIndex((index) => (index < banners.length ? index : 0));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length < 2 || !rotationEnabled || hovered || focused) return;
    const timer = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % banners.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [banners.length, rotationEnabled, hovered, focused]);

  if (!banners.length) return null;

  const banner = banners[currentIndex] ?? banners[0];
  const canRotate = banners.length > 1;
  const changeSlide = (direction: number) => {
    setCurrentIndex((index) => (index + direction + banners.length) % banners.length);
  };

  return (
    <section
      aria-label={canRotate ? 'Fuel advertisements' : 'Fuel promotion'}
      aria-roledescription={canRotate ? 'carousel' : undefined}
      className="mx-auto my-6 max-w-[1280px] px-4 md:my-8 sm:px-6"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) return;
        setFocused(false);
      }}
    >
      <div
        aria-live={rotationEnabled && !reducedMotion ? 'off' : 'polite'}
        aria-atomic="true"
        className="relative grid grid-cols-1 overflow-hidden rounded-2xl border border-neutral-800 bg-[#121212] shadow-xl md:grid-cols-12"
      >
        <div className="z-10 flex flex-col justify-between p-6 text-white sm:p-8 lg:p-10 md:col-span-7">
          <div key={banner.id} role="group" aria-roledescription="slide" aria-label={`${currentIndex + 1} of ${banners.length}: ${banner.title}`}>
            <h2 className="mb-4 font-sans text-3xl font-black uppercase leading-[0.95] tracking-tight sm:text-4xl lg:text-5xl">{banner.title}</h2>
            <p className="mb-6 max-w-lg text-base font-medium leading-snug text-neutral-200 sm:text-lg lg:text-xl">{banner.body}</p>
            {banner.linkUrl && (
              <a href={banner.linkUrl} className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-extrabold text-black transition-transform hover:scale-[1.02] hover:bg-neutral-100 active:scale-[0.98] sm:px-8 sm:text-base">
                View details <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
        <div className="relative min-h-[220px] overflow-hidden bg-neutral-950 sm:min-h-[260px] md:col-span-5 md:min-h-[300px]">
          {banner.imageUrl ? <img src={banner.imageUrl} alt={banner.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105" /> : <div className="absolute inset-0 bg-gradient-to-br from-[#193856] to-[#0d1e30]" aria-hidden="true" />}
        </div>
      </div>

      {canRotate && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-2" role="group" aria-label="Choose fuel advertisement">
            {banners.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(index)}
                aria-label={`Show advertisement ${index + 1}: ${item.title}`}
                aria-current={index === currentIndex ? 'true' : undefined}
                className={`h-2.5 rounded-full transition-all ${index === currentIndex ? 'w-7 bg-[#1e3a5f]' : 'w-2.5 bg-neutral-400 hover:bg-neutral-700'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-neutral-700">
            <span className="mr-1 text-xs font-semibold tabular-nums" aria-hidden="true">{currentIndex + 1} / {banners.length}</span>
            <button type="button" onClick={() => changeSlide(-1)} aria-label="Previous fuel advertisement" className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100">
              <ArrowLeft className="size-4" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => setRotationEnabled((enabled) => !enabled)} aria-label={rotationEnabled ? 'Pause fuel advertisement rotation' : 'Resume fuel advertisement rotation'} className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100">
              {rotationEnabled ? <Pause className="size-4" aria-hidden="true" /> : <Play className="size-4" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => changeSlide(1)} aria-label="Next fuel advertisement" className="inline-flex size-9 items-center justify-center rounded-full border border-neutral-300 bg-white transition-colors hover:bg-neutral-100">
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
