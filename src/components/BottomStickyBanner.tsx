import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';

export const BottomStickyBanner: React.FC = () => {
  const [visible, setVisible] = useState(true);
  const cms = useCmsContent();
  const banner = cms?.banners.find((item) => item.slot === 'top_announcement');

  if (!visible || !banner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#7360f2] bg-[#8574ff] px-4 py-2.5 text-neutral-950 shadow-lg">
      <div className="relative mx-auto flex max-w-[1280px] items-center justify-between text-center">
        {banner.linkUrl ? (
          <a href={banner.linkUrl} className="flex flex-1 items-center justify-center gap-1.5 text-center text-xs font-extrabold tracking-tight text-neutral-950 hover:underline sm:text-sm">
            <span>{banner.title}</span><ArrowRight className="h-4 w-4 shrink-0 stroke-[2.5]" />
          </a>
        ) : <span className="flex-1 text-center text-xs font-extrabold tracking-tight text-neutral-950 sm:text-sm">{banner.title}</span>}
        <button type="button" onClick={() => setVisible(false)} className="ml-3 rounded-full p-1 text-neutral-950 transition-colors hover:bg-black/10" aria-label="Dismiss announcement"><X className="h-4 w-4" /></button>
      </div>
    </div>
  );
};
