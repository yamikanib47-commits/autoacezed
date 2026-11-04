interface PageSeoResponse {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  imageUrl?: string;
  imageAlt?: string;
  robots?: string;
  siteName?: string;
  structuredData?: unknown;
}

function setMeta(attribute: 'name' | 'property', key: string, value?: string) {
  const selector = `meta[${attribute}="${key}"]`;
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!value) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = value;
}

export async function syncPageMetadata(path: string, signal: AbortSignal) {
  const response = await fetch(`/api/seo?path=${encodeURIComponent(path)}`, {
    headers: { Accept: 'application/json' },
    signal,
  });
  if (!response.headers.get('content-type')?.includes('application/json')) return;
  const seo = await response.json() as PageSeoResponse;
  if (!seo.title || !seo.canonicalUrl) return;

  document.title = seo.title;
  setMeta('name', 'description', seo.description);
  setMeta('name', 'robots', seo.robots || 'index,follow');
  setMeta('property', 'og:title', seo.title);
  setMeta('property', 'og:description', seo.description);
  setMeta('property', 'og:type', 'website');
  setMeta('property', 'og:url', seo.canonicalUrl);
  setMeta('property', 'og:site_name', seo.siteName || 'Autoace Zambia');
  setMeta('property', 'og:locale', 'en_ZM');
  setMeta('name', 'twitter:card', seo.imageUrl ? 'summary_large_image' : 'summary');
  setMeta('name', 'twitter:title', seo.title);
  setMeta('name', 'twitter:description', seo.description);
  setMeta('property', 'og:image', seo.imageUrl);
  setMeta('property', 'og:image:alt', seo.imageUrl ? seo.imageAlt || seo.title : undefined);
  setMeta('name', 'twitter:image', seo.imageUrl);

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = seo.canonicalUrl;

  let structuredData = document.getElementById('autoace-structured-data') as HTMLScriptElement | null;
  if (!structuredData) {
    structuredData = document.createElement('script');
    structuredData.id = 'autoace-structured-data';
    structuredData.type = 'application/ld+json';
    document.head.appendChild(structuredData);
  }
  structuredData.textContent = JSON.stringify(seo.structuredData || {});
}
