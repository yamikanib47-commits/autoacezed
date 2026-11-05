import React from 'react';

type LeadType = 'buy' | 'sell' | 'agent';

interface LeadTypeTabsProps {
  active: LeadType;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToAgent?: () => void;
}

const items: { id: LeadType; label: string; action: keyof Omit<LeadTypeTabsProps, 'active'>; }[] = [
  { id: 'buy', label: 'Buy', action: 'onNavigateToBuy' },
  { id: 'sell', label: 'Sell', action: 'onNavigateToSell' },
  { id: 'agent', label: 'Agent', action: 'onNavigateToAgent' },
];

export const LeadTypeTabs: React.FC<LeadTypeTabsProps> = ({ active, ...actions }) => (
  <nav aria-label="Choose a request type" className="mb-8 grid grid-cols-3 gap-1 rounded-2xl border border-neutral-200 bg-neutral-50 p-1">
    {items.map((item) => active === item.id ? (
      <span key={item.id} aria-current="page" className="flex min-h-11 items-center justify-center rounded-xl bg-[#1e3a5f] px-2 text-xs font-extrabold uppercase tracking-[0.14em] text-white sm:text-sm">{item.label}</span>
    ) : (
      <button key={item.id} type="button" onClick={actions[item.action]} className="min-h-11 rounded-xl px-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-600 transition hover:bg-white hover:text-[#1e3a5f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a5f] sm:text-sm">{item.label}</button>
    ))}
  </nav>
);
