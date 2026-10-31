import React from 'react';
import { ArrowUpRight, BookOpen, Play } from 'lucide-react';
import { useCmsContent } from '../services/cmsContent';
import type { CmsArticle } from '../services/cmsContent';

const groups: { kind: CmsArticle['kind']; title: string }[] = [
  { kind: 'review', title: 'Reviews' },
  { kind: 'news', title: 'News' },
  { kind: 'video', title: 'Videos' },
];

export const EditorialDarkSection: React.FC = () => {
  const cms = useCmsContent();
  const articles = cms?.articles ?? [];
  const availableGroups = groups.map((group) => ({ ...group, items: articles.filter((article) => article.kind === group.kind) })).filter((group) => group.items.length > 0);
  if (availableGroups.length === 0) return null;

  return (
    <section className="bg-[#111111] py-14 text-white sm:py-20">
      <div className="mx-auto max-w-[1280px] px-4 sm:px-6">
        <div className="mb-8 flex items-end gap-3">
          <BookOpen className="size-6 text-[#a99cff]" />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a99cff]">From Autoace</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">Guides and updates</h2>
          </div>
        </div>

        <div className="grid gap-10">
          {availableGroups.map((group) => (
            <div key={group.kind}>
              <h3 className="mb-4 text-lg font-extrabold">{group.title}</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.slice(0, 6).map((article) => (
                  <article key={article.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                    {article.imageUrl ? (
                      <img src={article.imageUrl} alt="" loading="lazy" className="aspect-[16/10] w-full object-cover" />
                    ) : (
                      <div className="flex aspect-[16/10] items-center justify-center bg-white/[0.06] text-white/50">{article.kind === 'video' ? <Play className="size-8" /> : <BookOpen className="size-8" />}</div>
                    )}
                    <div className="p-5">
                      {article.meta && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#b8adff]">{article.meta}</p>}
                      <h4 className="text-lg font-extrabold leading-snug">{article.title}</h4>
                      {article.summary && <p className="mt-2 text-sm leading-relaxed text-neutral-300">{article.summary}</p>}
                      {article.body && <details className="mt-4"><summary className="cursor-pointer text-sm font-bold text-[#c8beff]">Read article</summary><div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-neutral-300">{article.body}</div></details>}
                      {article.videoUrl && <a href={article.videoUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-[#c8beff] hover:text-white">Watch video <ArrowUpRight className="size-4" /></a>}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
