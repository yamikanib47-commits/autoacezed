import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AutoaceLogo } from './AutoaceLogo';

interface HeaderProps {
  onNavigateToHome?: () => void;
  onNavigateToBuy?: () => void;
  onNavigateToSell?: () => void;
  onNavigateToShowroom?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigateToHome,
  onNavigateToBuy,
  onNavigateToSell,
  onNavigateToShowroom,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = [
    { label: 'Browse cars', href: '/showroom', action: onNavigateToShowroom },
    { label: 'Buy a car', href: '/buyacar', action: onNavigateToBuy },
    { label: 'Sell a car', href: '/sellacar', action: onNavigateToSell },
  ];

  const renderLink = (link: typeof links[number], mobile = false) => (
    <a
      key={link.label}
      href={link.href}
      onClick={(event) => {
        setMenuOpen(false);
        if (link.action) {
          event.preventDefault();
          link.action();
        }
      }}
      className={mobile
        ? 'block rounded-lg px-4 py-3 text-sm font-semibold text-white hover:bg-white/10'
        : 'rounded-full px-4 py-2 text-sm font-semibold text-neutral-200 transition-colors hover:bg-white/10 hover:text-white'}
    >
      {link.label}
    </a>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#111111] text-white">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-2 sm:px-6">
        <a
          href="/"
          onClick={(event) => {
            if (onNavigateToHome) {
              event.preventDefault();
              onNavigateToHome();
            }
            setMenuOpen(false);
          }}
          aria-label="Autoace Zambia home"
          className="flex items-center"
        >
          <AutoaceLogo className="h-12 w-auto object-contain" style={{ width: 56, height: 48 }} />
        </a>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 sm:flex">
          {links.map((link) => renderLink(link))}
        </nav>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex size-10 items-center justify-center rounded-lg text-white hover:bg-white/10 sm:hidden"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav aria-label="Mobile navigation" className="border-t border-white/10 px-4 py-3 sm:hidden">
          {links.map((link) => renderLink(link, true))}
        </nav>
      )}
    </header>
  );
};
