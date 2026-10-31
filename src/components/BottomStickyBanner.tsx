import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

export const BottomStickyBanner: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const cms = useCmsContent();
  const banner = cms?.banners.find((item) => item.slot === 'top_announcement');

  if (!visible || !banner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#142d49] bg-[#1e3a5f] px-4 py-2.5 text-white shadow-lg">
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-between text-center">
        {banner.linkUrl ? (
          <a href={banner.linkUrl} className="flex flex-1 items-center justify-center gap-1.5 text-center text-xs font-extrabold tracking-tight text-white hover:underline sm:text-sm">
            <span>{banner.title}</span><ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </a>
        ) : <span className="flex-1 text-center text-xs font-extrabold tracking-tight text-white sm:text-sm">{banner.title}</span>}
        <button type="button" onClick={() => setVisible(false)} className="ml-3 rounded-full p-1 text-white transition-colors hover:bg-black/10" aria-label="Dismiss announcement"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
