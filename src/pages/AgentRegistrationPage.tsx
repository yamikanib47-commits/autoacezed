import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft, Loader2, ShieldCheck } from 'lucide-react';
import { AutoaceLogo } from '../components/AutoaceLogo';
import { LeadTypeTabs } from '../components/LeadTypeTabs';
import { submissionKeyFor, submitAgentLead, type AgentLead, type PendingSubmissionKey } from '../services/leadService';

interface AgentRegistrationPageProps {
  onBackToHome: () => void;
  onNavigateToBuy: () => void;
  onNavigateToSell: () => void;
}

interface AgentForm {
  fullName: string;
  whatsappNumber: string;
  cityTown: string;
  province: string;
  email: string;
  experienceRange: string;
  professionalRole: string;
  otherProfessionalRole: string;
  companyName: string;
  operatesIndependently: boolean;
  vehicleTypes: string[];
  otherVehicleTypes: string;
  sourcingRegions: string[];
  services: string[];
  monthlyVolume: string;
  auctionAccess: string;
  inspectionCapability: string;
  availability: string;
  additionalInformation: string;
  privacyConsent: boolean;
}

const provinces = ['Central', 'Copperbelt', 'Eastern', 'Luapula', 'Lusaka', 'Muchinga', 'Northern', 'North-Western', 'Southern', 'Western'];
const experienceOptions = ['Less than 1 year', '1–2 years', '3–5 years', '5–10 years', '10+ years'];
const roleOptions = ['Independent vehicle agent', 'Dealership employee', 'Dealership owner', 'Vehicle importer', 'Car broker', 'Other'];
const vehicleOptions = ['Any make or model', 'Japanese vehicles', 'European vehicles', 'Luxury vehicles', 'Commercial vehicles', 'Other'];
const sourceOptions = ['Within my city', 'Across Zambia', 'Japan', 'South Africa', 'Singapore', 'Other international markets'];
const serviceOptions = ['Finding vehicles for buyers', 'Connecting buyers with dealerships', 'Vehicle inspections', 'Import coordination', 'Vehicle delivery', 'Selling vehicles on behalf of clients'];
const volumeOptions = ['1–2', '3–5', '6–10', '10+', 'Varies'];
const accessOptions = ['Yes', 'No', 'Through a partner'];
const availabilityOptions = ['Yes, currently available', 'Yes, but depending on availability', 'Not currently available'];
const fieldClass = 'w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15';
const labelClass = 'block space-y-2 text-sm font-semibold text-neutral-800';

function SingleChoice({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-neutral-800">{label} <span className="text-[#1e3a5f]">*</span></legend>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {options.map((option) => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition ${value === option ? 'border-[#1e3a5f] bg-[#eef3f8] text-neutral-950 ring-2 ring-[#1e3a5f]/15' : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400'}`}>
            <span className={`mr-2 inline-grid size-4 place-items-center rounded-full border ${value === option ? 'border-[#1e3a5f] bg-[#1e3a5f]' : 'border-neutral-300'}`}>
              {value === option && <span className="size-1.5 rounded-full bg-white" />}
            </span>
            {option}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function MultiChoice({ label, options, selected, onToggle }: { label: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-neutral-800">{label} <span className="text-[#1e3a5f]">*</span></legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button key={option} type="button" aria-pressed={active} onClick={() => onToggle(option)} className={`rounded-full border px-3.5 py-2 text-left text-xs font-bold transition sm:text-sm ${active ? 'border-[#1e3a5f] bg-[#eef3f8] text-[#1e3a5f]' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-400'}`}>
              {active ? '✓ ' : '+ '}{option}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-neutral-500">Select all that apply.</p>
    </fieldset>
  );
}

export const AgentRegistrationPage: React.FC<AgentRegistrationPageProps> = ({ onBackToHome, onNavigateToBuy, onNavigateToSell }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const pendingSubmission = useRef<PendingSubmissionKey | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lead, setLead] = useState<AgentLead | null>(null);
  const [form, setForm] = useState<AgentForm>({
    fullName: '', whatsappNumber: '', cityTown: '', province: '', email: '', experienceRange: '', professionalRole: '', otherProfessionalRole: '', companyName: '', operatesIndependently: false, vehicleTypes: [], otherVehicleTypes: '', sourcingRegions: [], services: [], monthlyVolume: '', auctionAccess: '', inspectionCapability: '', availability: '', additionalInformation: '', privacyConsent: false,
  });
  const operatesIndependently = form.professionalRole === 'Independent vehicle agent' || form.operatesIndependently;

  function update<K extends keyof AgentForm>(key: K, value: AgentForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
  }

  function toggleList(key: 'vehicleTypes' | 'sourcingRegions' | 'services', value: string) {
    setForm((current) => {
      const selected = current[key];
      if (key === 'vehicleTypes' && value === 'Any make or model') {
        return { ...current, vehicleTypes: selected.includes(value) ? [] : [value] };
      }
      const filtered = key === 'vehicleTypes' ? selected.filter((item) => item !== 'Any make or model') : selected;
      return { ...current, [key]: filtered.includes(value) ? filtered.filter((item) => item !== value) : [...filtered, value] };
    });
    setError('');
  }

  function validateStep(currentStep: 1 | 2 | 3) {
    if (currentStep === 1) {
      if (form.fullName.trim().length < 2) return 'Enter your full name.';
      const phoneDigits = form.whatsappNumber.replace(/\D/g, '');
      if (phoneDigits.length < 9 || phoneDigits.length > 15) return 'Enter a valid WhatsApp number, including your country code.';
      if (form.cityTown.trim().length < 2) return 'Enter your city or town.';
      if (!provinces.includes(form.province)) return 'Choose your province.';
      if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'Enter a valid email address or leave it blank.';
    }
    if (currentStep === 2) {
      if (!experienceOptions.includes(form.experienceRange)) return 'Choose how long you have worked in the vehicle business.';
      if (!roleOptions.includes(form.professionalRole)) return 'Choose the role that best describes you.';
      if (form.professionalRole === 'Other' && !form.otherProfessionalRole.trim()) return 'Tell us what your professional role is.';
      if (!operatesIndependently && !form.companyName.trim()) return 'Enter your dealership or company name, or indicate that you operate independently.';
      if (!form.vehicleTypes.length) return 'Choose at least one vehicle type you can source.';
      if (form.vehicleTypes.includes('Other') && !form.otherVehicleTypes.trim()) return 'Describe the other vehicle types you can source.';
      if (!form.sourcingRegions.length) return 'Choose at least one vehicle sourcing location.';
      if (!form.services.length) return 'Choose at least one service you can facilitate.';
    }
    if (currentStep === 3) {
      if (!volumeOptions.includes(form.monthlyVolume)) return 'Choose your monthly vehicle activity.';
      if (!accessOptions.includes(form.auctionAccess)) return 'Choose an auction access option.';
      if (!accessOptions.includes(form.inspectionCapability)) return 'Choose an inspection option.';
      if (!availabilityOptions.includes(form.availability)) return 'Choose your current availability.';
      if (!form.privacyConsent) return 'Please confirm the privacy consent before submitting your application.';
    }
    return '';
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validationError = validateStep(step);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (step < 3) {
      setStep((current) => (current + 1) as 2 | 3);
      setError('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const payload = {
        fullName: form.fullName.trim(),
        whatsappNumber: form.whatsappNumber.trim(),
        location,
        cityTown: form.cityTown.trim(),
        province: form.province,
        email: form.email.trim(),
        experienceRange: form.experienceRange,
        professionalRole: form.professionalRole,
        otherProfessionalRole: form.otherProfessionalRole.trim(),
        companyName: form.companyName.trim(),
        operatesIndependently,
        vehicleTypes: form.vehicleTypes,
        otherVehicleTypes: form.otherVehicleTypes.trim(),
        sourcingRegions: form.sourcingRegions,
        services: form.services,
        monthlyVolume: form.monthlyVolume,
        auctionAccess: form.auctionAccess,
        inspectionCapability: form.inspectionCapability,
        availability: form.availability,
        additionalInformation: form.additionalInformation.trim(),
        privacyConsent: form.privacyConsent,
      };
      const pending = submissionKeyFor(payload, pendingSubmission.current);
      pendingSubmission.current = pending;
      const result = await submitAgentLead({ ...payload, submissionKey: pending.key });
      pendingSubmission.current = null;
      setLead(result);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We could not submit your application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const progress = lead ? 100 : [34, 67, 100][step - 1];
  const location = [form.cityTown, form.province].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-neutral-900">
      <div className="grid min-h-screen lg:grid-cols-[minmax(0,1.12fr)_minmax(340px,0.88fr)]">
        <main className="flex min-h-screen flex-col px-5 py-6 sm:px-9 sm:py-9 lg:px-14 lg:py-10">
          <header className="mb-7 flex items-center justify-between gap-4">
            <AutoaceLogo variant="light-mode" className="h-6 w-40" style={{ width: '160px', height: '24px' }} />
            <button type="button" onClick={onBackToHome} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-neutral-600 transition hover:bg-white hover:text-neutral-950">
              <ArrowLeft className="size-4" /><span className="hidden sm:inline">Back to home</span>
            </button>
          </header>
          <LeadTypeTabs active="agent" onNavigateToBuy={onNavigateToBuy} onNavigateToSell={onNavigateToSell} />

          <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
            {!lead ? (
              <>
                <div className="mb-7">
                  <div className="mb-3 flex items-center justify-between gap-4 text-xs font-bold uppercase tracking-[0.15em] text-neutral-500">
                    <span>Agent registration</span><span>Step {step} of 3</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200"><div className="h-full rounded-full bg-[#1e3a5f] transition-all duration-300" style={{ width: `${progress}%` }} /></div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-semibold text-neutral-500 sm:text-xs">
                    {['Personal information', 'Professional details', 'Experience & availability'].map((name, index) => <span key={name} className={index + 1 === step ? 'text-[#1e3a5f]' : ''}>{name}</span>)}
                  </div>
                </div>

                <div className="mb-6">
                  <span className="inline-flex items-center rounded-full border border-[#1e3a5f]/15 bg-[#eef3f8] px-3 py-1 text-xs font-bold text-[#1e3a5f]">AutoAce agent network</span>
                  <h1 className="mt-3 text-3xl font-black tracking-tight text-neutral-950 sm:text-4xl">Work with us to source the right cars.</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-600">Tell us how you work and what you can source. The AutoAce team will review your application before any approval.</p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
                  <div className="space-y-6">
                    {step === 1 && (
                      <section aria-labelledby="agent-personal-heading" className="space-y-5">
                        <h2 id="agent-personal-heading" className="text-lg font-extrabold text-neutral-900">Personal information</h2>
                        <label className={labelClass}>Full name <span className="text-[#1e3a5f]">*</span>
                          <input required autoComplete="name" value={form.fullName} onChange={(event) => update('fullName', event.target.value)} className={fieldClass} maxLength={80} />
                        </label>
                        <label className={labelClass}>Phone number <span className="text-neutral-500">(WhatsApp preferred)</span> <span className="text-[#1e3a5f]">*</span>
                          <input required type="tel" inputMode="tel" autoComplete="tel" value={form.whatsappNumber} onChange={(event) => update('whatsappNumber', event.target.value)} className={fieldClass} placeholder="e.g. +260 97 123 4567" maxLength={30} />
                        </label>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <label className={labelClass}>City / Town <span className="text-[#1e3a5f]">*</span>
                            <input required autoComplete="address-level2" value={form.cityTown} onChange={(event) => update('cityTown', event.target.value)} className={fieldClass} placeholder="e.g. Lusaka" maxLength={80} />
                          </label>
                          <label className={labelClass}>Province <span className="text-[#1e3a5f]">*</span>
                            <select required value={form.province} onChange={(event) => update('province', event.target.value)} className={fieldClass}>
                              <option value="">Choose your province</option>{provinces.map((province) => <option key={province}>{province}</option>)}
                            </select>
                          </label>
                        </div>
                        <label className={labelClass}>Email address <span className="font-normal text-neutral-500">Optional</span>
                          <input type="email" autoComplete="email" value={form.email} onChange={(event) => update('email', event.target.value)} className={fieldClass} placeholder="name@example.com" maxLength={160} />
                        </label>
                      </section>
                    )}

                    {step === 2 && (
                      <section aria-labelledby="agent-professional-heading" className="space-y-6">
                        <h2 id="agent-professional-heading" className="text-lg font-extrabold text-neutral-900">Professional information</h2>
                        <label className={labelClass}>How long have you been involved in the motor vehicle business? <span className="text-[#1e3a5f]">*</span>
                          <select required value={form.experienceRange} onChange={(event) => update('experienceRange', event.target.value)} className={fieldClass}>
                            <option value="">Choose an experience range</option>{experienceOptions.map((option) => <option key={option}>{option}</option>)}
                          </select>
                        </label>
                        <SingleChoice label="What best describes your professional role?" value={form.professionalRole} options={roleOptions} onChange={(value) => setForm((current) => ({ ...current, professionalRole: value, operatesIndependently: value === 'Independent vehicle agent' }))} />
                        {form.professionalRole === 'Other' && (
                          <label className={labelClass}>Tell us about your role <span className="text-[#1e3a5f]">*</span>
                            <input required value={form.otherProfessionalRole} onChange={(event) => update('otherProfessionalRole', event.target.value)} className={fieldClass} maxLength={100} />
                          </label>
                        )}
                        <div className="space-y-3">
                          <label className={labelClass}>Dealership or company name {operatesIndependently ? <span className="font-normal text-neutral-500">Not needed if you work independently</span> : <span className="text-[#1e3a5f">*</span>}
                            <input required={!operatesIndependently} disabled={operatesIndependently} value={form.companyName} onChange={(event) => update('companyName', event.target.value)} className={`${fieldClass} disabled:bg-neutral-100 disabled:text-neutral-500`} placeholder={operatesIndependently ? 'Independent operator' : 'Business or dealership name'} maxLength={120} />
                          </label>
                          <label className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                            <input type="checkbox" checked={operatesIndependently} disabled={form.professionalRole === 'Independent vehicle agent'} onChange={(event) => update('operatesIndependently', event.target.checked)} className="mt-0.5 size-4 accent-[#1e3a5f]" />
                            <span>I operate independently</span>
                          </label>
                        </div>
                        <MultiChoice label="What types of vehicles can you source?" options={vehicleOptions} selected={form.vehicleTypes} onToggle={(value) => toggleList('vehicleTypes', value)} />
                        {form.vehicleTypes.includes('Other') && (
                          <label className={labelClass}>Other vehicle types <span className="text-[#1e3a5f]">*</span>
                            <input required value={form.otherVehicleTypes} onChange={(event) => update('otherVehicleTypes', event.target.value)} className={fieldClass} maxLength={120} />
                          </label>
                        )}
                        <MultiChoice label="Where can you source vehicles from?" options={sourceOptions} selected={form.sourcingRegions} onToggle={(value) => toggleList('sourcingRegions', value)} />
                        <MultiChoice label="What services can you facilitate?" options={serviceOptions} selected={form.services} onToggle={(value) => toggleList('services', value)} />
                      </section>
                    )}

                    {step === 3 && (
                      <section aria-labelledby="agent-availability-heading" className="space-y-6">
                        <h2 id="agent-availability-heading" className="text-lg font-extrabold text-neutral-900">Experience & availability</h2>
                        <SingleChoice label="Approximately how many vehicles do you source or sell monthly?" value={form.monthlyVolume} options={volumeOptions} onChange={(value) => update('monthlyVolume', value)} />
                        <SingleChoice label="Do you have access to vehicle auction platforms?" value={form.auctionAccess} options={accessOptions} onChange={(value) => update('auctionAccess', value)} />
                        <SingleChoice label="Can you facilitate vehicle inspections?" value={form.inspectionCapability} options={accessOptions} onChange={(value) => update('inspectionCapability', value)} />
                        <SingleChoice label="Are you available to receive vehicle sourcing requests?" value={form.availability} options={availabilityOptions} onChange={(value) => update('availability', value)} />
                        <label className={labelClass}>Additional information <span className="font-normal text-neutral-500">Optional</span>
                          <textarea value={form.additionalInformation} onChange={(event) => update('additionalInformation', event.target.value)} className={`${fieldClass} min-h-24 resize-y`} placeholder="Share a little about your experience or the areas you cover." maxLength={1000} />
                        </label>
                        <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-5">
                          <label className="flex items-start gap-3 text-sm leading-6 text-neutral-700">
                            <input required type="checkbox" checked={form.privacyConsent} onChange={(event) => update('privacyConsent', event.target.checked)} className="mt-1 size-4 shrink-0 accent-[#1e3a5f]" />
                            <span>By submitting this form, you consent to AutoAce collecting and processing your personal information for agent registration, communication, verification, and potential business opportunities within the AutoAce network. Your information will be handled securely in accordance with our <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-bold text-[#1e3a5f] underline underline-offset-2">Privacy Notice (draft)</a>.</span>
                          </label>
                          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-neutral-500"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#1e3a5f]" />We do not ask for NRC numbers or NRC document uploads at this stage.</p>
                        </div>
                      </section>
                    )}
                  </div>

                  {error && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p>}

                  <div className="mt-8 flex items-center justify-between gap-3 border-t border-neutral-200 pt-5">
                    <button type="button" disabled={isSubmitting} onClick={() => { setError(''); if (step === 1) onBackToHome(); else setStep((current) => (current - 1) as 1 | 2); }} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-neutral-600 transition hover:bg-neutral-100 disabled:opacity-50">
                      <ChevronLeft className="size-4" />{step === 1 ? 'Home' : 'Back'}
                    </button>
                    <button type="submit" disabled={isSubmitting} className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3.5 text-sm font-bold text-white transition hover:bg-[#142d49] disabled:cursor-wait disabled:opacity-60">
                      {isSubmitting ? <><Loader2 className="size-4 animate-spin" />Submitting…</> : step === 3 ? 'Register as an agent' : <>Continue<ArrowRight className="size-4" /></>}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <section className="my-auto rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9" aria-live="polite">
                <div className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><CheckCircle2 className="size-8" /></div>
                <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.15em] text-[#1e3a5f]">Application received</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-neutral-950">Thank you, {form.fullName.split(' ')[0]}.</h1>
                <p className="mt-4 text-sm leading-6 text-neutral-600">Your application has been received! The AutoAce team will review your information and contact you regarding the next steps.</p>
                <div className="mt-6 rounded-xl bg-[#f4f6f8] p-4">
                  <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500">Application reference</span>
                  <span className="mt-1 block font-mono text-lg font-extrabold text-[#1e3a5f]">{lead.referenceId}</span>
                  <span className="mt-2 block text-xs text-neutral-500">Status: Pending review</span>
                </div>
                <button type="button" onClick={onBackToHome} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#1e3a5f] px-5 py-3 text-sm font-bold text-white hover:bg-[#142d49]">Back to AutoAce<ArrowRight className="size-4" /></button>
              </section>
            )}
          </div>
          {!lead && <p className="mx-auto mt-8 w-full max-w-2xl text-xs leading-5 text-neutral-500">Your application is reviewed by the AutoAce team. Submitting it does not automatically approve you or create an employment relationship.</p>}
        </main>

        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#1e3a5f] px-10 py-12 text-white lg:flex xl:px-16">
          <div className="absolute -right-28 -top-24 size-96 rounded-full border border-white/10" />
          <div className="absolute -bottom-32 -left-24 size-96 rounded-full border border-white/10" />
          <div className="relative z-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-white/65">AutoAce Zambia</p>
            <h2 className="mt-5 max-w-md text-4xl font-black leading-tight tracking-tight">Good sourcing starts with good people.</h2>
            <p className="mt-5 max-w-md text-sm leading-6 text-white/75">We connect buyers with people who know the vehicle market. Tell us what you can source and where you work.</p>
            <ul className="mt-9 space-y-4 text-sm text-white/85">
              {['Your application stays pending until reviewed', 'Choose several vehicle types, markets and services', 'No NRC numbers or documents requested'].map((item) => <li key={item} className="flex gap-3"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-300" />{item}</li>)}
            </ul>
          </div>
          <div className="relative z-10 rounded-2xl border border-white/15 bg-white/5 p-5 text-sm">
            <p className="font-bold">Your application summary</p>
            <div className="mt-4 space-y-2 text-white/75">
              <p><span className="text-white/50">Name:</span> {form.fullName || 'Not entered yet'}</p>
              <p><span className="text-white/50">Location:</span> {location || 'Not entered yet'}</p>
              <p><span className="text-white/50">Role:</span> {form.professionalRole || 'Not selected yet'}</p>
              <p><span className="text-white/50">Vehicle types:</span> {form.vehicleTypes.length ? form.vehicleTypes.join(', ') : 'Not selected yet'}</p>
              <p><span className="text-white/50">Services:</span> {form.services.length ? `${form.services.length} selected` : 'Not selected yet'}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
