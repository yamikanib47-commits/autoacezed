import React, { useEffect, useState } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import type { ShowroomCar } from '../data/showroomData';
import { submitBuyLead, type BuyLead } from '../services/leadService';
import { useCmsVehicles } from '../services/cmsContent';
import { ArrowLeft, ArrowRight, CalendarDays, Car, Check, Fuel, Gauge, MapPin, MessageSquare, Share2, X } from 'lucide-react';

interface CarDetailPageProps {
  carId: string;
  onBack: () => void;
  onNavigateToHome?: () => void;
  onNavigateToBuy: () => void;
  onNavigateToSell: (carPhrase?: string) => void;
  onNavigateToShowroom: () => void;
  onNavigateToDeal: (carId: string) => void;
}

export const CarDetailPage: React.FC<CarDetailPageProps> = ({
  carId,
  onBack,
  onNavigateToHome,
  onNavigateToBuy,
  onNavigateToSell,
  onNavigateToShowroom,
  onNavigateToDeal,
}) => {
  const { vehicles, loaded } = useCmsVehicles();
  const car = vehicles.find((vehicle) => vehicle.id === carId);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [enquiryError, setEnquiryError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<BuyLead | null>(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActivePhotoIdx(0);
    setSubmittedLead(null);
    if (car) {
      setEnquiryMessage(`I am interested in the ${car.year} ${car.name}${car.trim ? ` (${car.trim})` : ''}. Please contact me with more information.`);
    } else {
      setEnquiryMessage('');
    }
  }, [carId, car?.id]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Link copied');
      window.setTimeout(() => setShareMessage(''), 2500);
    } catch {
      setShareMessage('Copy this page link to share it');
      window.setTimeout(() => setShareMessage(''), 3500);
    }
  };

  const handleEnquirySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!car) return;
    setEnquiryError(null);
    const normalizedPhone = enquiryPhone.trim().replace(/[^\d+]/g, '');
    if (enquiryName.trim().length < 2) {
      setEnquiryError('Please enter your name.');
      return;
    }
    if (!/^\+?\d+$/.test(normalizedPhone) || normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      setEnquiryError('Enter a valid WhatsApp number, including your country code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const lead = await submitBuyLead({
        make: car.make,
        model: car.model || car.name,
        yearRange: String(car.year || ''),
        budgetZMW: car.priceZMW ? `K ${car.priceZMW.toLocaleString()}` : '',
        location: car.location || '',
        urgency: 'Enquiry about a listed vehicle',
        customerName: enquiryName.trim(),
        whatsappNumber: normalizedPhone,
        notes: enquiryMessage.trim(),
      });
      setSubmittedLead(lead);
    } catch {
      setEnquiryError("Your enquiry wasn't submitted. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loaded || !car) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 font-sans flex flex-col">
        <Header onNavigateToHome={onNavigateToHome || onBack} onNavigateToBuy={onNavigateToBuy} onNavigateToSell={onNavigateToSell} onNavigateToShowroom={onNavigateToShowroom} />
        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#6852f5]">Autoace Showroom</p>
          <h1 className="mt-3 text-3xl font-black text-neutral-900">{loaded ? 'This listing is unavailable' : 'Loading vehicle listing'}</h1>
          <p className="mt-3 text-sm text-neutral-600">{loaded ? 'This vehicle is not currently published.' : 'Checking the published vehicle catalogue.'}</p>
          {loaded && <button type="button" onClick={onNavigateToShowroom} className="mt-7 rounded-lg bg-[#8574ff] px-5 py-3 text-sm font-bold text-neutral-950">Browse available vehicles</button>}
        </main>
        <Footer onNavigateToHome={onNavigateToHome} onNavigateToBuy={onNavigateToBuy} onNavigateToSell={onNavigateToSell} />
      </div>
    );
  }

  const specifications = [
    { label: 'Year', value: car.year ? String(car.year) : '' },
    { label: 'Make', value: car.make },
    { label: 'Model', value: car.model },
    { label: 'Trim', value: car.trim },
    { label: 'Body style', value: car.bodyStyle },
    { label: 'Fuel', value: car.fuelType },
    { label: 'Transmission', value: car.gearbox },
    { label: 'Engine', value: car.engineSize },
    { label: 'Mileage', value: car.mileageKm ? `${car.mileageKm.toLocaleString()} km` : '' },
    { label: 'Condition', value: car.condition },
    { label: 'Location', value: car.location },
  ].filter((item) => item.value);
  const siblings = vehicles.filter((vehicle) => vehicle.id !== car.id && vehicle.make === car.make).slice(0, 3);
  const image = car.images[activePhotoIdx];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-neutral-900 font-sans flex flex-col">
      <Header onNavigateToHome={onNavigateToHome || onBack} onNavigateToBuy={onNavigateToBuy} onNavigateToSell={onNavigateToSell} onNavigateToShowroom={onNavigateToShowroom} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 sm:px-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-neutral-950"><ArrowLeft className="size-4" /> Back</button>
          <button type="button" onClick={handleShare} className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-700 hover:border-neutral-400"><Share2 className="size-4" /> Share</button>
        </div>
        {shareMessage && <p className="mb-3 text-right text-xs text-neutral-500" role="status">{shareMessage}</p>}

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
          <section className="min-w-0">
            <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
              {image ? <img src={image} alt={car.name} className="aspect-[16/10] w-full object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center text-neutral-400"><Car className="size-20" aria-hidden="true" /><span className="sr-only">No vehicle photo available</span></div>}
              {car.images.length > 1 && (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3">
                  <button type="button" aria-label="Previous photo" onClick={() => setActivePhotoIdx((index) => (index - 1 + car.images.length) % car.images.length)} className="rounded-full bg-black/65 p-2 text-white"><ArrowLeft className="size-4" /></button>
                  <span className="rounded-full bg-black/65 px-3 py-1 text-xs font-bold text-white">{activePhotoIdx + 1} / {car.images.length}</span>
                  <button type="button" aria-label="Next photo" onClick={() => setActivePhotoIdx((index) => (index + 1) % car.images.length)} className="rounded-full bg-black/65 p-2 text-white"><ArrowRight className="size-4" /></button>
                </div>
              )}
            </div>
            {car.images.length > 1 && <div className="mt-3 flex gap-2 overflow-x-auto">{car.images.map((photo, index) => <button key={`${photo}-${index}`} type="button" onClick={() => setActivePhotoIdx(index)} aria-label={`Show photo ${index + 1}`} className={`shrink-0 overflow-hidden rounded-lg border-2 ${index === activePhotoIdx ? 'border-[#8574ff]' : 'border-transparent'}`}><img src={photo} alt="" className="size-16 object-cover" /></button>)}</div>}
            <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
              <h2 className="text-lg font-black">Vehicle details</h2>
              <dl className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3">{specifications.map((item) => <div key={item.label}><dt className="text-xs font-semibold text-neutral-500">{item.label}</dt><dd className="mt-1 break-words text-sm font-bold">{item.value}</dd></div>)}</dl>
            </section>
            {car.features.length > 0 && <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Features</h2><ul className="mt-4 grid gap-2 sm:grid-cols-2">{car.features.map((feature) => <li key={feature} className="flex items-start gap-2 text-sm text-neutral-700"><Check className="mt-0.5 size-4 shrink-0 text-[#6852f5]" />{feature}</li>)}</ul></section>}
            {car.fullDescription && <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Description</h2><p className="mt-3 whitespace-pre-line text-sm leading-6 text-neutral-700">{car.fullDescription}</p></section>}
            {car.detailedSpecs?.some((group) => group.items.length > 0) && <section className="mt-4 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6"><h2 className="text-lg font-black">Additional specifications</h2><div className="mt-4 space-y-5">{car.detailedSpecs.filter((group) => group.items.length > 0).map((group) => <div key={group.category}><h3 className="text-sm font-bold">{group.category}</h3><dl className="mt-2 grid gap-2 sm:grid-cols-2">{group.items.map((item) => <div key={`${group.category}-${item.label}`} className="flex justify-between gap-4 border-b border-neutral-100 py-2 text-sm"><dt className="text-neutral-500">{item.label}</dt><dd className="text-right font-semibold">{item.value}</dd></div>)}</dl></div>)}</div></section>}
          </section>

          <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
            <p className="text-xs font-bold uppercase tracking-widest text-[#6852f5]">{car.condition}</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{car.name}</h1>
            {car.trim && <p className="mt-1 text-sm text-neutral-600">{car.trim}</p>}
            {car.location && <p className="mt-3 flex items-center gap-1.5 text-sm text-neutral-600"><MapPin className="size-4" />{car.location}</p>}
            {car.priceZMW > 0 && <p className="mt-5 text-3xl font-black">K {car.priceZMW.toLocaleString()}</p>}
            {car.monthlyZMW > 0 && <p className="mt-1 text-xs text-neutral-500">Monthly amount supplied with this listing: K {car.monthlyZMW.toLocaleString()}</p>}
            {car.dealer && <p className="mt-4 border-t border-neutral-100 pt-4 text-sm text-neutral-600">Listed by <span className="font-bold text-neutral-900">{car.dealer}</span></p>}
            {car.dealerPhone && <a href={`tel:${car.dealerPhone}`} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 px-4 py-3 text-sm font-bold hover:bg-neutral-50">Call {car.dealerPhone}</a>}

            {submittedLead ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900" role="status"><p className="font-bold">Enquiry received</p><p className="mt-1">Reference: {submittedLead.referenceId}</p></div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="mt-5 space-y-3 border-t border-neutral-100 pt-5">
                <h2 className="text-lg font-black">Ask about this listing</h2>
                <label className="block text-xs font-bold text-neutral-700">Your name<input required minLength={2} value={enquiryName} onChange={(event) => setEnquiryName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#8574ff]" autoComplete="name" /></label>
                <label className="block text-xs font-bold text-neutral-700">WhatsApp number<input required type="tel" value={enquiryPhone} onChange={(event) => setEnquiryPhone(event.target.value)} placeholder="+260…" className="mt-1.5 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#8574ff]" autoComplete="tel" /></label>
                <label className="block text-xs font-bold text-neutral-700">Message<textarea value={enquiryMessage} onChange={(event) => setEnquiryMessage(event.target.value)} rows={3} className="mt-1.5 w-full resize-y rounded-lg border border-neutral-300 px-3 py-2.5 text-sm font-normal outline-none focus:border-[#8574ff]" /></label>
                {enquiryError && <p className="text-xs font-semibold text-red-700" role="alert">{enquiryError}</p>}
                <button disabled={isSubmitting} type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#8574ff] px-4 py-3 text-sm font-black text-neutral-950 hover:bg-[#7360f2] disabled:cursor-wait disabled:opacity-60"><MessageSquare className="size-4" />{isSubmitting ? 'Sending…' : 'Send enquiry'}</button>
                <p className="text-xs leading-5 text-neutral-500">Your enquiry is saved to Autoace for follow-up. Confirm availability, condition and terms before any transaction.</p>
              </form>
            )}
          </aside>
        </div>

        {siblings.length > 0 && <section className="mt-12"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#6852f5]">More listings</p><h2 className="mt-1 text-xl font-black">Other {car.make} vehicles</h2></div><button type="button" onClick={onNavigateToShowroom} className="text-sm font-bold text-[#6852f5]">Browse all</button></div><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{siblings.map((vehicle) => <button key={vehicle.id} type="button" onClick={() => onNavigateToDeal(vehicle.id)} className="overflow-hidden rounded-xl border border-neutral-200 bg-white text-left hover:shadow-md">{vehicle.images[0] ? <img src={vehicle.images[0]} alt={vehicle.name} className="aspect-[16/10] w-full object-cover" /> : <div className="flex aspect-[16/10] items-center justify-center bg-neutral-100 text-neutral-400"><Car className="size-12" /></div>}<span className="block p-4"><span className="block font-bold">{vehicle.name}</span><span className="mt-1 block text-sm text-neutral-600">{vehicle.priceZMW ? `K ${vehicle.priceZMW.toLocaleString()}` : 'Price on request'}</span></span></button>)}</div></section>}
      </main>
      <Footer onNavigateToHome={onNavigateToHome} onNavigateToBuy={onNavigateToBuy} onNavigateToSell={onNavigateToSell} />
    </div>
  );
};
