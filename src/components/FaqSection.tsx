import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

export const FaqSection: React.FC = () => {
  const cms = useCmsContent();
  const items = cms?.faqs ?? [];
  const [openIds, setOpenIds] = useState<string[]>([]);

  if (!items.length) return null;

  const toggle = (id: string) => {
    setOpenIds((previous) => previous.includes(id) ? previous.filter((item) => item !== id) : [...previous, id]);
  };

  return (
    <section className="mx-auto my-10 max-w-[1280px] px-4 sm:my-14 sm:px-6">
      <h2 className="mb-6 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl">Frequently asked questions</h2>
      <div className="space-y-3">
        {items.map((item) => {
          const isOpen = openIds.includes(item.id);
          return (
            <div key={item.id} className="overflow-hidden rounded-xl border border-neutral-200 bg-[#fcfbfa] transition-colors">
              <button type="button" onClick={() => toggle(item.id)} className="flex w-full cursor-pointer items-center justify-between p-4 text-left font-bold text-neutral-900 transition-colors hover:bg-neutral-50 hover:text-black sm:p-5" aria-expanded={isOpen}>
                <span className="text-sm font-extrabold sm:text-base">{item.question}</span>
                <ChevronDown className={`ml-4 h-5 w-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen && <div className="px-4 pb-5 text-sm leading-relaxed text-neutral-600 sm:px-5">{item.answer}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
};
