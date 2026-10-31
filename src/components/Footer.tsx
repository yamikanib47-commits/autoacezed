import React from 'react';
import { AutoaceLogo } from './AutoaceLogo';

interface FooterProps {
  onNavigateToHome?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigateToHome, onNavigateToBuy, onNavigateToSell }) => {
  const handle = (action?: () => void) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!action) return;
    event.preventDefault();
    action();
  };

  return (
    <footer className="border-t border-neutral-800 bg-[#111111] text-white">
      <div className="mx-auto max-w-[1280px] px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <a href="/" onClick={handle(onNavigateToHome)} aria-label="Autoace Zambia home" className="inline-flex items-center">
              <AutoaceLogo variant="dark-footer" alt="Autoace Zambia" className="h-12 w-auto" style={{ width: 'auto', height: '48px' }} />
            </a>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-neutral-300">Find listed cars, request a vehicle, or submit a car for sale in Zambia.</p>
          </div>
          <div>
            <h2 className="text-sm font-bold">Explore</h2>
            <nav aria-label="Footer navigation" className="mt-3 flex flex-col items-start gap-2 text-sm text-neutral-300">
              <a href="/showroom" className="hover:text-white">Browse cars</a>
              <a href="/buyacar" onClick={handle(onNavigateToBuy)} className="hover:text-white">Request a car</a>
              <a href="/sellacar" onClick={handle(onNavigateToSell)} className="hover:text-white">Sell a car</a>
            </nav>
          </div>
          <div>
            <h2 className="text-sm font-bold">Admin</h2>
            <a href="/admin" className="mt-3 inline-block text-sm text-neutral-300 hover:text-white">Admin sign-in</a>
            <p className="mt-4 text-xs leading-relaxed text-neutral-400">Confirm vehicle details, condition, price and availability with the seller before purchase.</p>
          </div>
        </div>
        <div className="mt-8 border-t border-white/10 pt-5 text-xs text-neutral-400">
          © {new Date().getFullYear()} Autoace Zambia
        </div>
      </div>
    </footer>
  );
};
