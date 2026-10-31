import React, { useState, useMemo, useEffect } from 'react';
import { AutoaceLogo } from '../components/AutoaceLogo';
import { submitSellLead, SellLead } from '../services/leadService';
import {
  ChevronLeft,
  CheckCircle2,
  Camera,
  MapPin,
  Phone,
  User,
  Check,
  Car,
  Edit3,
  AlertCircle,
} from 'lucide-react';

interface SellACarPageProps {
  onBackToHome: () => void;
  initialCarPhrase?: string;
  initialReg?: string; // Backwards compatibility if passed
}

interface ParsedCarDetails {
  title: string;
  year: string;
  make: string;
  model: string;
}

function parseVehiclePhrase(phrase: string): { year: string; make: string; model: string } {
  const clean = phrase.trim();
  const yearMatch = clean.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch?.[0] || '';
  const remainder = clean.replace(year, '').trim();
  const words = remainder.split(/\s+/).filter(Boolean);
  return {
    year,
    make: words.shift() || '',
    model: words.join(' '),
  };
}

export const SellACarPage: React.FC<SellACarPageProps> = ({
  onBackToHome,
  initialCarPhrase,
  initialReg,
}) => {
  // Slide 1: Car details
  // Slide 2: Pricing
  // Slide 3: Photos
  // Slide 4: Personal info (Name, phone, location)
  // Slide 5: Thank you & confirmation
  const [slide, setSlide] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Initialize vehicle info from query phrase (clean empty state if none passed)
  const queryPhrase = (initialCarPhrase ?? '').trim();
  const initialParsed = useMemo(() => parseVehiclePhrase(queryPhrase), [queryPhrase]);

  const [selectedYear, setSelectedYear] = useState<string>(initialParsed.year);
  const [selectedMake, setSelectedMake] = useState<string>(initialParsed.make);
  const [selectedModel, setSelectedModel] = useState<string>(initialParsed.model);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Synchronize when query parameter changes
  useEffect(() => {
    const updated = parseVehiclePhrase(queryPhrase);
    setSelectedYear(updated.year);
    setSelectedMake(updated.make);
    setSelectedModel(updated.model);
    setValidationError(null);
  }, [queryPhrase]);

  // Keep the vehicle summary limited to details entered by the seller.
  const carDetails: ParsedCarDetails = useMemo(() => {
    const title = [selectedYear, selectedMake, selectedModel].filter(Boolean).join(' ');
    return {
      title: title || 'Vehicle details',
      year: selectedYear,
      make: selectedMake,
      model: selectedModel,
    };
  }, [selectedYear, selectedMake, selectedModel]);

  // Form states
  const [mileage, setMileage] = useState('');
  const [gearbox, setGearbox] = useState<'Manual' | 'Automatic' | ''>('');
  const [fuelType, setFuelType] = useState('');
  const [condition, setCondition] = useState<'Excellent' | 'Good' | 'Fair' | ''>('');

  // Slide 2: Pricing (In Zambian Kwacha)
  const [expectedPrice, setExpectedPrice] = useState('');

  // Slide 3: Photos
  const [photosReady, setPhotosReady] = useState<{ [key: string]: boolean }>({
    front: false,
    rear: false,
    interior: false,
    wheels: false,
  });

  // Slide 4: Personal Info in Zambia
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedLead, setSubmittedLead] = useState<SellLead | null>(null);

  const popularZambiaLocations = [
    'Lusaka',
    'Ndola',
    'Kitwe',
    'Livingstone',
    'Kabwe',
    'Chipata',
    'Solwezi',
    'Chingola',
  ];

  const progressPercentage = {
    1: 20,
    2: 45,
    3: 70,
    4: 90,
    5: 100,
  }[slide];

  const togglePhoto = (slot: string) => {
    setPhotosReady((prev) => ({ ...prev, [slot]: !prev[slot] }));
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const normalizedPhone = phoneNumber.trim().replace(/[^\d+]/g, '');
    if (fullName.trim().length < 2) {
      setSubmitError('Please enter your full name.');
      return;
    }
    if (!/^\+?\d+$/.test(normalizedPhone) || normalizedPhone.length < 9 || normalizedPhone.length > 15) {
      setSubmitError('Enter a valid WhatsApp number, including your country code.');
      return;
    }
    if (!location.trim()) {
      setSubmitError('Please enter your city or location.');
      return;
    }
    const askingPrice = expectedPrice.replace(/[^\d]/g, '');
    if (!askingPrice || Number(askingPrice) <= 0) {
      setSubmitError('Enter a valid asking price in Kwacha.');
      return;
    }

    setIsSubmitting(true);
    try {
      const lead = await submitSellLead({
        make: carDetails.make,
        model: carDetails.model,
        year: selectedYear,
        mileage: mileage.trim(),
        transmission: gearbox,
        fuelType,
        condition,
        askingPriceZMW: askingPrice,
        location: location.trim(),
        regNumber: initialReg?.trim() || undefined,
        sellerName: fullName.trim(),
        whatsappNumber: normalizedPhone,
        photosCount: Object.values(photosReady).filter(Boolean).length,
      });
      setSubmittedLead(lead);
      setSlide(5);
    } catch {
      setSubmitError("We couldn't send your request. Your details have not been submitted; please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col relative">
      {/* Mobile Ambient Top Backdrop */}
      <div className="lg:hidden h-28 bg-gradient-to-b from-[#fedcd2]/70 via-[#fde9e3]/60 to-[#daf5f2]/70 absolute top-0 left-0 right-0 z-0"></div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-screen relative z-10">
        {/* Left Interactive Area */}
        <div className="w-full lg:w-[58%] xl:w-[54%] min-h-screen bg-white rounded-t-[28px] lg:rounded-none mt-12 lg:mt-0 p-6 sm:p-10 lg:p-14 flex flex-col justify-between shadow-lg lg:shadow-none">
          <div>
            {/* Header Brand */}
            <div className="mb-8">
              <button
                type="button"
                onClick={onBackToHome}
                className="hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center"
                title="Return to Autoace Home"
              >
                <AutoaceLogo variant="light-mode" className="w-[150px] h-[150px] object-contain" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
              </button>
            </div>

            {/* Subheader & Progress Bar */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => {
                  if (slide > 1) {
                    setSlide((s) => (s - 1) as 1 | 2 | 3 | 4);
                  } else {
                    onBackToHome();
                  }
                }}
                className="inline-flex items-center gap-1 font-bold text-sm text-neutral-900 hover:underline cursor-pointer"
              >
                <span className="font-extrabold text-base">&lt;</span>
                <span className="underline underline-offset-2">Back</span>
              </button>

              <span className="text-xs sm:text-sm font-bold text-neutral-800">
                {progressPercentage}% completed
              </span>
            </div>

            <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-[#8574ff] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>

            {/* SLIDE 1: Car Details (Clean empty form with Year, Make, Model or hydrated from query phrase) */}
            {slide === 1 && (
              <div className="animate-in fade-in duration-200 max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6852f5] text-xs font-bold border border-[#8574ff]/30">
                    Step 1 of 5
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">Zambian Market</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-neutral-900 tracking-tight leading-tight mb-2 font-sans">
                  What are you selling?
                </h1>
                                <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-6">
                  Add the vehicle details and asking price you want to submit.
                </p>

                {validationError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{validationError}</span>
                  </div>
                )}

                {/* Vehicle Selection Box */}
                <div className="bg-[#f8f7f5] p-4 sm:p-5 rounded-2xl border border-neutral-200 mb-6 space-y-3.5">
                  {/* Active recognized vehicle banner */}
                  {selectedMake && selectedModel && (
                    <div className="p-3 bg-white rounded-xl border border-neutral-200 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-[#8574ff] text-neutral-950 flex items-center justify-center shrink-0">
                          <Car className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-neutral-900 leading-tight">
                            {carDetails.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 font-medium">Check the details against your vehicle documents.</p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* Clean Form: Year, Make, Model */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Year Selector */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Year
                      </label>
                      <select
                        value={selectedYear}
                        onChange={(e) => {
                          setSelectedYear(e.target.value);
                          setValidationError(null);
                        }}
                        className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-[#8574ff] cursor-pointer"
                      >
                        <option value="">Select Year</option>
                        {Array.from({ length: 36 }, (_, i) => new Date().getFullYear() - i).map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1" htmlFor="seller-make">
                        Make
                      </label>
                      <input
                        id="seller-make"
                        type="text"
                        value={selectedMake}
                        onChange={(e) => {
                          setSelectedMake(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder="Vehicle make"
                        className="w-full px-3 py-2.5 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-[#8574ff]"
                      />
                    </div>

                    {/* Model Input */}
                    <div>
                      <label className="block text-xs font-bold text-neutral-800 mb-1">
                        Model
                      </label>
                      <input
                        type="text"
                        value={selectedModel}
                        onChange={(e) => {
                          setSelectedModel(e.target.value);
                          setValidationError(null);
                        }}
                        placeholder="Enter the vehicle make and model"
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs sm:text-sm font-bold text-neutral-900 outline-none focus:ring-2 focus:ring-[#8574ff] placeholder:text-neutral-400 placeholder:font-normal"
                      />
                    </div>
                  </div>

                </div>

                <div className="space-y-4 mb-8">
                  {/* Mileage */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      Current Odometer Reading
                    </label>
                    <input
                      type="text"
                      value={mileage}
                      onChange={(e) => setMileage(e.target.value)}
                      placeholder="e.g. 94,500 km"
                      className="w-full px-4 py-3 border border-neutral-300 rounded-lg text-sm sm:text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8574ff]"
                    />
                  </div>

                  {/* Gearbox */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      Transmission
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['Automatic', 'Manual'] as const).map((gb) => (
                        <button
                          key={gb}
                          type="button"
                          onClick={() => setGearbox(gb)}
                          className={`py-3 text-center rounded-lg text-sm font-bold border transition-all cursor-pointer ${
                            gearbox === gb
                              ? 'bg-[#f5f3ff] border-[#8574ff] text-neutral-950 font-black shadow-xs'
                              : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {gb}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      Fuel Type
                    </label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {['Petrol', 'Diesel', 'Hybrid/EV'].map((fuel) => (
                        <button
                          key={fuel}
                          type="button"
                          onClick={() => setFuelType(fuel)}
                          className={`py-2.5 text-center rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            fuelType === fuel
                              ? 'bg-[#f5f3ff] border-[#8574ff] text-neutral-950 font-black shadow-xs'
                              : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {fuel}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!selectedYear.trim() || !selectedMake.trim() || !selectedModel.trim()) {
                      setValidationError('Please select your vehicle year and enter its make and model to continue.');
                      return;
                    }
                    setValidationError(null);
                    setSlide(2);
                  }}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#8574ff] hover:bg-[#7360f2] text-neutral-950 font-black text-sm sm:text-base text-center transition-colors shadow-sm cursor-pointer"
                >
                  Continue to pricing
                </button>
              </div>
            )}

            {/* SLIDE 2: Pricing & Valuation (In Zambian Kwacha) */}
            {slide === 2 && (
              <div className="animate-in fade-in duration-200 max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6852f5] text-xs font-bold border border-[#8574ff]/30">
                    Step 2 of 5
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">Asking price</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-neutral-900 tracking-tight leading-tight mb-2 font-sans">
                  Set your asking price
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-6">
                  Autoace does not calculate a market valuation. Enter the amount you want to ask for this vehicle.
                </p>

                <div className="bg-[#111111] text-white p-6 rounded-2xl mb-6 shadow-md border border-neutral-800">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#8574ff]">Vehicle</p>
                      <p className="mt-1 text-lg font-black">{carDetails.title}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-neutral-300">Seller-provided price</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5" htmlFor="seller-asking-price">
                      Asking price in Kwacha (K)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-neutral-600 text-sm">K</span>
                      <input
                        id="seller-asking-price"
                        type="text"
                        inputMode="numeric"
                        value={expectedPrice}
                        onChange={(e) => { setExpectedPrice(e.target.value); setSubmitError(null); }}
                        placeholder="Enter your asking price"
                        className="w-full pl-9 pr-4 py-3 border border-neutral-300 rounded-lg text-sm sm:text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8574ff]"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-1">This is your price, not an automated estimate.</p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">Car overall condition</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Excellent', 'Good', 'Fair'] as const).map((cond) => (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => { setCondition(cond); setSubmitError(null); }}
                          className={`py-3 text-center rounded-lg text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                            condition === cond
                              ? 'bg-[#f5f3ff] border-[#8574ff] text-neutral-950 font-black shadow-xs'
                              : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          {cond}
                        </button>
                      ))}
                    </div>
                  </div>
                  {submitError && <p role="alert" className="text-sm font-semibold text-red-700">{submitError}</p>}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!expectedPrice.replace(/[^\d]/g, '') || Number(expectedPrice.replace(/[^\d]/g, '')) <= 0) {
                      setSubmitError('Enter a valid asking price in Kwacha.');
                      return;
                    }
                    if (!condition) {
                      setSubmitError('Select the vehicle condition.');
                      return;
                    }
                    setSubmitError(null);
                    setSlide(3);
                  }}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#8574ff] hover:bg-[#7360f2] text-neutral-950 font-black text-sm sm:text-base text-center transition-colors shadow-sm cursor-pointer"
                >
                  Continue to photos
                </button>
              </div>
            )}

            {/* SLIDE 3: Photo checklist */}
            {slide === 3 && (
              <div className="animate-in fade-in duration-200 max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6852f5] text-xs font-bold border border-[#8574ff]/30">
                    Step 3 of 5
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">Photo Checklist</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-neutral-900 tracking-tight leading-tight mb-2 font-sans">
                  Which photos can you share?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-6">
                  This checklist only notes which photos you can share if you are contacted about your request.
                </p>

                {/* Photo Upload Slots Grid */}
                <div className="grid grid-cols-2 gap-3.5 mb-8">
                  {[
                    { id: 'front', label: 'Front & side angle' },
                    { id: 'rear', label: 'Rear profile' },
                    { id: 'interior', label: 'Dashboard & seats' },
                    { id: 'wheels', label: 'Engine & white book' },
                  ].map((slot) => {
                    const isReady = photosReady[slot.id];
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        aria-pressed={isReady}
                        aria-label={`${slot.label}: ${isReady ? 'ready to share' : 'mark ready to share'}`}
                        onClick={() => togglePhoto(slot.id)}
                        className={`w-full border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center cursor-pointer transition-all aspect-[4/3] relative overflow-hidden group ${
                          isReady
                            ? 'border-[#8574ff] bg-[#f5f3ff]/50'
                            : 'border-neutral-300 hover:border-neutral-400 bg-neutral-50'
                        }`}
                      >
                        {isReady ? (
                          <>
                            <span className="mb-2 flex size-8 items-center justify-center rounded-full bg-[#8574ff] text-neutral-950">
                              <Check className="size-4 stroke-[3]" />
                            </span>
                            <span className="text-xs font-bold text-neutral-900">{slot.label}</span>
                            <span className="mt-0.5 text-[10px] text-neutral-500">Ready to share</span>
                          </>
                        ) : (
                          <>
                            <Camera className="w-7 h-7 text-neutral-400 group-hover:text-neutral-700 transition-colors mb-1.5" />
                            <span className="text-xs font-bold text-neutral-800">{slot.label}</span>
                            <span className="text-[10px] text-neutral-500 mt-0.5">Mark ready to share</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setSlide(4)}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#8574ff] hover:bg-[#7360f2] text-neutral-950 font-black text-sm sm:text-base text-center transition-colors shadow-sm cursor-pointer"
                >
                  Continue to contact details
                </button>
              </div>
            )}

            {/* SLIDE 4: Personal Info (Name, phone, location in Zambia) */}
            {slide === 4 && (
              <div className="animate-in fade-in duration-200 max-w-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#f5f3ff] text-[#6852f5] text-xs font-bold border border-[#8574ff]/30">
                    Step 4 of 5
                  </span>
                  <span className="text-xs font-semibold text-neutral-500">Contact Details</span>
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-neutral-900 tracking-tight leading-tight mb-2 font-sans">
                  How can our team reach you?
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-6">
                  An Autoace coordinator will review your request and contact you on WhatsApp about the next steps.
                </p>

                <div className="space-y-4 mb-8">
                  {/* Name */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                        <User className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg text-sm sm:text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8574ff]"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      Phone Number (WhatsApp enabled) *
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="+260"
                        className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg text-sm sm:text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8574ff]"
                      />
                    </div>
                  </div>

                  {/* Location in Zambia */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-neutral-900 mb-1.5">
                      City / Location in Zambia *
                    </label>
                    <div className="relative mb-2">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="e.g. Lusaka, Zambia"
                        className="w-full pl-11 pr-4 py-3 border border-neutral-300 rounded-lg text-sm sm:text-base font-bold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#8574ff]"
                      />
                    </div>

                    {/* Quick selection chips for Zambian cities */}
                    <div className="flex flex-wrap gap-1.5">
                      {popularZambiaLocations.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setLocation(`${loc}, Zambia`)}
                          className={`text-xs px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                            location.startsWith(loc)
                              ? 'bg-[#8574ff] text-neutral-950 font-bold'
                              : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="pt-2 text-xs text-neutral-500">Provide a number we can use to follow up on this vehicle request.</p>
                </div>

                {submitError && (
                  <div role="alert" className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                    {submitError}
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg bg-[#8574ff] hover:bg-[#7360f2] text-neutral-950 font-black text-sm sm:text-base text-center transition-colors shadow-sm cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting request...' : 'Submit vehicle details'}
                </button>
              </div>
            )}

            {/* SLIDE 5: Thank You & Final Confirmation */}
            {slide === 5 && (
              <div className="animate-in fade-in duration-200 max-w-lg">
                <div className="w-14 h-14 rounded-full bg-[#f0edff] flex items-center justify-center text-[#6852f5] mb-5">
                  <CheckCircle2 className="w-8 h-8 text-[#553ee6]" />
                </div>

                <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-black text-neutral-900 tracking-tight leading-tight mb-2 font-sans">
                  Thank you, {fullName}!
                </h1>
                <p className="text-xs sm:text-sm text-neutral-600 font-medium mb-6">
                  Your request has been received. An Autoace coordinator will review your details and contact you about the next steps.
                </p>
                {submittedLead?.referenceId && (
                  <div className="inline-flex mb-5 bg-[#f0edff] text-[#553ee6] border border-[#8574ff]/30 rounded-lg px-3 py-2 text-xs font-bold">
                    Reference: {submittedLead.referenceId}
                  </div>
                )}

                {/* Final Summary Card */}
                <div className="bg-[#f8f7f5] rounded-xl p-5 border border-neutral-200 space-y-3 mb-6 text-xs text-neutral-700">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="font-extrabold text-neutral-900">Vehicle:</span>
                    <span className="bg-[#8574ff] text-neutral-950 font-black px-2.5 py-1 rounded text-xs">
                      {carDetails.title || 'Vehicle Listing'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Transmission:</span>
                    <span className="font-bold text-neutral-900">{gearbox || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Fuel type:</span>
                    <span className="font-bold text-neutral-900">{fuelType || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Condition:</span>
                    <span className="font-bold text-neutral-900">{condition || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Asking price:</span>
                    <span className="font-bold text-neutral-900">K {expectedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Location:</span>
                    <span className="font-bold text-neutral-900">{location}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Next step:</span>
                    <span className="font-bold text-neutral-900">Coordinator review and follow-up</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={onBackToHome}
                    className="w-full py-3.5 px-6 rounded-lg bg-black hover:bg-neutral-800 text-white font-extrabold text-sm sm:text-base text-center transition-colors cursor-pointer shadow"
                  >
                    Return to Autoace Home
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Desktop Ambient Gradient Side */}
        <div className="hidden lg:flex lg:w-[42%] xl:w-[46%] min-h-screen bg-gradient-to-br from-[#fedcd2]/60 via-[#fde9e3]/50 to-[#daf5f2]/80 relative overflow-hidden flex-col justify-center items-center p-10 xl:p-14">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent pointer-events-none"></div>

          <div className="relative z-10 max-w-sm w-full bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl border border-white/60 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-[#f0edff] text-[#6852f5] text-[11px] font-black uppercase tracking-wider">
                Zambian Market Direct
              </span>
              <span className="text-xs font-bold text-neutral-500">Autoace Zed</span>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Listing details</p>
              <h3 className="mt-0.5 text-lg font-black leading-snug text-neutral-900">{carDetails.title || 'Add your vehicle details'}</h3>
              <p className="mt-1 text-xs text-neutral-600">Check each detail against your vehicle documents before submitting.</p>
            </div>

            <div className="space-y-2 border-t border-neutral-200/80 pt-3 text-xs text-neutral-600">
              <div className="flex justify-between gap-3"><span>Transmission</span><span className="font-semibold text-neutral-900">{gearbox || 'Not selected'}</span></div>
              <div className="flex justify-between gap-3"><span>Fuel type</span><span className="font-semibold text-neutral-900">{fuelType || 'Not selected'}</span></div>
              <div className="flex justify-between gap-3"><span>Condition</span><span className="font-semibold text-neutral-900">{condition || 'Not selected'}</span></div>
              <div className="flex justify-between gap-3"><span>Asking price</span><span className="font-semibold text-neutral-900">{expectedPrice ? `K ${expectedPrice}` : 'Not set'}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
