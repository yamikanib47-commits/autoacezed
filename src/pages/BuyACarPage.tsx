import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Search } from 'lucide-react';
import { AutoaceLogo } from '../components/AutoaceLogo';
import { Footer } from '../components/Footer';
import { useCmsVehicles } from '../services/cmsContent';
import { submitBuyLead, type BuyLead } from '../services/leadService';

interface BuyACarPageProps {
  onBackToHome: () => void;
  initialQuery?: string;
}

type BuyStep = 1 | 2 | 3 | 4 | 5;
type BuyingIntent = 'specific' | 'guidance' | '';

interface BuyForm {
  buyingIntent: BuyingIntent;
  make: string;
  model: string;
  vehicleDescription: string;
  yearRange: string;
  budgetZMW: string;
  budgetBasis: 'total' | 'monthly';
  preferredFuel: string;
  preferredTransmission: string;
  preferredBodyStyle: string;
  preferredColour: string;
  location: string;
  urgency: string;
  customerName: string;
  whatsappNumber: string;
  notes: string;
}

const steps = [
  { title: 'What are you looking for?', detail: 'Share what you know, or tell us you would like help choosing.' },
  { title: 'Set a budget', detail: 'A guide helps the team look for suitable options. You can skip this.' },
  { title: 'Choose your preferences', detail: 'Add preferences that matter to you. Every field is optional.' },
  { title: 'Where and when?', detail: 'Tell us where you are and when you hope to buy.' },
  { title: 'How can we reach you?', detail: 'Add contact details so the team can respond to your request.' },
];

const progressForStep = [20, 40, 60, 80, 100];
const labelClass = 'block space-y-2 text-sm font-semibold text-neutral-800';
const fieldClass = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#8574ff] focus:ring-2 focus:ring-[#8574ff]/15';
const choiceClass = (selected: boolean) => `w-full rounded-xl border px-4 py-3 text-left text-sm font-semibold transition ${selected ? 'border-[#8574ff] bg-[#f4f2ff] text-neutral-950 ring-2 ring-[#8574ff]/15' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'}`;

export const BuyACarPage: React.FC<BuyACarPageProps> = ({ onBackToHome, initialQuery }) => {
  const { vehicles } = useCmsVehicles();
  const [step, setStep] = useState<BuyStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState<BuyLead | null>(null);
  const [form, setForm] = useState<BuyForm>({
    buyingIntent: '',
    make: '',
    model: '',
    vehicleDescription: '',
    yearRange: '',
    budgetZMW: '',
    budgetBasis: 'total',
    preferredFuel: '',
    preferredTransmission: '',
    preferredBodyStyle: '',
    preferredColour: '',
    location: '',
    urgency: '',
    customerName: '',
    whatsappNumber: '',
    notes: '',
  });

  useEffect(() => {
    const query = initialQuery?.trim();
    if (query) setForm((current) => current.vehicleDescription ? current : { ...current, vehicleDescription: query });
  }, [initialQuery]);

  const makes = useMemo(() => [...new Set(vehicles.map((car) => car.make).filter(Boolean))].sort(), [vehicles]);
  const models = useMemo(() => [...new Set(vehicles.filter((car) => !form.make || car.make === form.make).map((car) => car.model).filter(Boolean))].sort(), [form.make, vehicles]);
  const progress = lead ? 100 : progressForStep[step - 1];

  function update<K extends keyof BuyForm>(key: K, value: BuyForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function continueToNextStep() {
    setError('');
    if (step === 1 && !form.buyingIntent) {
      setError('Choose whether you have a specific car in mind or would like help choosing.');
      return;
    }
    if (step === 1 && form.buyingIntent === 'specific' && !form.make.trim() && !form.model.trim() && !form.vehicleDescription.trim()) {
      setError('Add a make, model or short description, or choose “Help me choose”.');
      return;
    }
    setStep((current) => Math.min(5, current + 1) as BuyStep);
  }

  function goBack() {
    setError('');
    if (step > 1) setStep((current) => Math.max(1, current - 1) as BuyStep);
    else onBackToHome();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step < 5) {
      continueToNextStep();
      return;
    }
    setError('');
    if (!form.customerName.trim()) {
      setError('Enter your name so the team knows who to contact.');
      return;
    }
    const digits = form.whatsappNumber.replace(/\D/g, '');
    if (digits.length < 9 || digits.length > 15) {
      setError('Enter a valid WhatsApp number, including your country code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitBuyLead({
        buyingIntent: form.buyingIntent || undefined,
        make: form.make.trim(),
        model: form.model.trim(),
        vehicleDescription: form.vehicleDescription.trim(),
        yearRange: form.yearRange,
        budgetZMW: form.budgetZMW.trim(),
        budgetBasis: form.budgetBasis,
        preferredFuel: form.preferredFuel,
        preferredTransmission: form.preferredTransmission,
        preferredBodyStyle: form.preferredBodyStyle,
        preferredColour: form.preferredColour.trim(),
        location: form.location.trim(),
        urgency: form.urgency,
        customerName: form.customerName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        notes: form.notes.trim(),
      });
      setLead(result);
    } catch {
      setError('We could not send your request. Your details have not been submitted; please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const summaryItems = [
    form.buyingIntent === 'specific' ? [form.make, form.model].filter(Boolean).join(' ') || form.vehicleDescription : form.buyingIntent === 'guidance' ? 'Help choosing a car' : '',
    form.yearRange,
    form.budgetZMW ? `ZMW ${form.budgetZMW}${form.budgetBasis === 'monthly' ? ' / month' : ''}` : '',
    [form.preferredBodyStyle, form.preferredFuel, form.preferredTransmission, form.preferredColour].filter(Boolean).join(' · '),
    form.location,
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <main className="flex min-h-screen flex-col px-5 py-6 sm:px-9 sm:py-9 lg:px-14 lg:py-10">
          <header className="mb-9 flex items-center justify-between">
            <AutoaceLogo variant="light-mode" className="h-6 w-40" style={{ width: '160px', height: '24px' }} />
            <button type="button" onClick={onBackToHome} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950">
              <ArrowLeft className="size-4" /> <span className="hidden sm:inline">Back to home</span>
            </button>
          </header>

          {!lead ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">
                  <span>Step {step} of 5</span>
                  <span>{progress}% complete</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label="Request progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
                  <div className="h-full rounded-full bg-[#8574ff] transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 grid grid-cols-5 gap-1.5" aria-hidden="true">
                  {steps.map((item, index) => <div key={item.title} className={`h-1 rounded-full transition-colors ${index < step ? 'bg-[#8574ff]' : 'bg-neutral-100'}`} />)}
                </div>
              </div>

              <div className="mb-8">
                <p className="mb-2 text-sm font-bold text-[#6654e8]">Find your next car</p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{steps[step - 1].title}</h1>
                <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">{steps[step - 1].detail}</p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                <div className="flex-1">
                  {step === 1 && (
                    <div className="space-y-6">
                      <fieldset className="space-y-3">
                        <legend className="mb-3 text-sm font-bold text-neutral-800">Which best describes you?</legend>
                        <button type="button" onClick={() => update('buyingIntent', 'specific')} aria-pressed={form.buyingIntent === 'specific'} className={choiceClass(form.buyingIntent === 'specific')}>I have a particular car in mind</button>
                        <button type="button" onClick={() => update('buyingIntent', 'guidance')} aria-pressed={form.buyingIntent === 'guidance'} className={choiceClass(form.buyingIntent === 'guidance')}>Help me choose</button>
                      </fieldset>
                      {form.buyingIntent === 'specific' && (
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className={labelClass}>Make
                            <input list="buy-makes" value={form.make} onChange={(event) => update('make', event.target.value)} className={fieldClass} placeholder="e.g. Toyota" autoComplete="off" />
                            <datalist id="buy-makes">{makes.map((make) => <option key={make} value={make} />)}</datalist>
                          </label>
                          <label className={labelClass}>Model
                            <input list="buy-models" value={form.model} onChange={(event) => update('model', event.target.value)} className={fieldClass} placeholder="e.g. Corolla" autoComplete="off" />
                            <datalist id="buy-models">{models.map((model) => <option key={model} value={model} />)}</datalist>
                          </label>
                          <label className={`${labelClass} sm:col-span-2`}>Or describe the car you have in mind
                            <textarea value={form.vehicleDescription} onChange={(event) => update('vehicleDescription', event.target.value)} className={`${fieldClass} min-h-24 resize-y`} placeholder="Tell us what you are looking for" maxLength={500} />
                          </label>
                        </div>
                      )}
                      {form.buyingIntent === 'guidance' && (
                        <label className={labelClass}>What should the team know about your needs?
                          <textarea value={form.vehicleDescription} onChange={(event) => update('vehicleDescription', event.target.value)} className={`${fieldClass} min-h-28 resize-y`} placeholder="For example: a reliable family car for daily driving" maxLength={500} />
                        </label>
                      )}
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => update('budgetBasis', 'total')} aria-pressed={form.budgetBasis === 'total'} className={choiceClass(form.budgetBasis === 'total')}>Total budget</button>
                        <button type="button" onClick={() => update('budgetBasis', 'monthly')} aria-pressed={form.budgetBasis === 'monthly'} className={choiceClass(form.budgetBasis === 'monthly')}>Monthly budget</button>
                      </div>
                      <label className={labelClass}>Approximate budget in ZMW
                        <input type="number" min="0" inputMode="numeric" value={form.budgetZMW} onChange={(event) => update('budgetZMW', event.target.value)} className={fieldClass} placeholder={form.budgetBasis === 'monthly' ? 'Monthly amount' : 'Total amount'} />
                      </label>
                      <label className={labelClass}>Preferred year
                        <select value={form.yearRange} onChange={(event) => update('yearRange', event.target.value)} className={fieldClass}>
                          <option value="">No preference</option>
                          <option value="2023 or newer">2023 or newer</option>
                          <option value="2018–2022">2018–2022</option>
                          <option value="2013–2017">2013–2017</option>
                          <option value="Before 2013">Before 2013</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className={labelClass}>Body style
                        <select value={form.preferredBodyStyle} onChange={(event) => update('preferredBodyStyle', event.target.value)} className={fieldClass}>
                          <option value="">No preference</option>
                          {['SUV', 'Hatchback', 'Saloon', 'Estate', 'Double Cab', 'Van', 'Coupe'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>Fuel type
                        <select value={form.preferredFuel} onChange={(event) => update('preferredFuel', event.target.value)} className={fieldClass}>
                          <option value="">No preference</option>
                          {['Petrol', 'Diesel', 'Hybrid', 'Electric'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>Transmission
                        <select value={form.preferredTransmission} onChange={(event) => update('preferredTransmission', event.target.value)} className={fieldClass}>
                          <option value="">No preference</option>
                          {['Automatic', 'Manual'].map((value) => <option key={value}>{value}</option>)}
                        </select>
                      </label>
                      <label className={labelClass}>Preferred colour
                        <input value={form.preferredColour} onChange={(event) => update('preferredColour', event.target.value)} className={fieldClass} placeholder="Optional" maxLength={40} />
                      </label>
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-5">
                      <label className={labelClass}>Town or city
                        <input value={form.location} onChange={(event) => update('location', event.target.value)} className={fieldClass} placeholder="e.g. Lusaka" autoComplete="address-level2" maxLength={100} />
                      </label>
                      <label className={labelClass}>When are you hoping to buy?
                        <select value={form.urgency} onChange={(event) => update('urgency', event.target.value)} className={fieldClass}>
                          <option value="">No fixed date</option>
                          <option value="As soon as possible">As soon as possible</option>
                          <option value="Within one month">Within one month</option>
                          <option value="Within three months">Within three months</option>
                          <option value="Just researching">Just researching</option>
                        </select>
                      </label>
                    </div>
                  )}

                  {step === 5 && (
                    <div className="space-y-4">
                      <label className={labelClass}>Your name
                        <input required value={form.customerName} onChange={(event) => update('customerName', event.target.value)} className={fieldClass} autoComplete="name" maxLength={120} />
                      </label>
                      <label className={labelClass}>WhatsApp number
                        <input required type="tel" value={form.whatsappNumber} onChange={(event) => update('whatsappNumber', event.target.value)} className={fieldClass} placeholder="Include country code, e.g. +260…" autoComplete="tel" maxLength={32} />
                      </label>
                      <label className={labelClass}>Anything else the team should know? <span className="font-normal text-neutral-500">Optional</span>
                        <textarea value={form.notes} onChange={(event) => update('notes', event.target.value)} className={`${fieldClass} min-h-24 resize-y`} maxLength={1000} />
                      </label>
                      <p className="text-xs leading-5 text-neutral-500">Submitting sends your request to Autoace for follow-up. It does not reserve a car or confirm availability or price.</p>
                    </div>
                  )}
                </div>

                {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

                <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-100 pt-5">
                  <button type="button" onClick={goBack} disabled={isSubmitting} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50">
                    <ChevronLeft className="size-4" /> {step === 1 ? 'Back to home' : 'Back'}
                  </button>
                  <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-wait disabled:opacity-60">
                    {isSubmitting ? 'Sending…' : step === 5 ? 'Send request' : 'Continue'}
                    {step < 5 && <ArrowRight className="size-4" />}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <section className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center" aria-live="polite">
              <div className="mb-8">
                <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[0.16em] text-neutral-500"><span>Request complete</span><span>100%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100" role="progressbar" aria-label="Request progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={100}><div className="h-full w-full rounded-full bg-[#8574ff]" /></div>
              </div>
              <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-8" /></div>
              <p className="text-sm font-bold text-emerald-700">Request received</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Thanks, {lead.customerName}.</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-neutral-600">Your request has been sent to the Autoace team. They can follow up using the WhatsApp number you provided.</p>
              {lead.referenceId && <p className="mt-5 text-sm font-bold text-neutral-800">Reference: {lead.referenceId}</p>}
              <button type="button" onClick={onBackToHome} className="mt-8 inline-flex w-fit items-center gap-2 rounded-xl bg-neutral-950 px-5 py-3 text-sm font-bold text-white hover:bg-neutral-800"><ArrowLeft className="size-4" /> Back to Autoace</button>
            </section>
          )}
        </main>

        <aside className="relative flex min-h-[520px] flex-col justify-between overflow-hidden bg-[#11110f] px-6 py-10 text-white sm:px-10 lg:min-h-screen lg:px-12 lg:py-14">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(133,116,255,0.2),transparent_55%)]" />
          <div className="relative">
            <div className="mb-9 flex size-12 items-center justify-center rounded-2xl bg-white/10 text-[#bdb3ff]"><Search className="size-6" /></div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#bdb3ff]">Your request</p>
            <h2 className="mt-3 max-w-md text-3xl font-black leading-tight sm:text-4xl">A clear brief helps the team search well.</h2>
                          <p className="mt-4 max-w-md text-sm leading-6 text-white/65">Share your requirements and the Autoace team will confirm suitable options, price and availability with you.</p>
          </div>

          <div className="relative mt-10 space-y-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/50">What you have shared</p>
              {summaryItems.length ? (
                <ul className="mt-4 space-y-2 text-sm text-white/85">{summaryItems.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul>
              ) : <p className="mt-4 text-sm text-white/55">Your choices will appear here as you go.</p>}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5">
              <p className="text-sm font-bold">Published catalogue</p>
              <p className="mt-2 text-sm leading-6 text-white/65">{vehicles.length ? `${vehicles.length} ${vehicles.length === 1 ? 'vehicle is' : 'vehicles are'} currently published. Ask the team to confirm availability.` : 'No vehicles have been published yet. You can still send a request for a car you want the team to source.'}</p>
            </div>
            <p className="text-xs leading-5 text-white/45">Sending a request does not reserve a vehicle. The team will confirm any price and availability directly.</p>
          </div>
        </aside>
      </div>
      <Footer onNavigateToHome={onBackToHome} />
    </div>
  );
};
