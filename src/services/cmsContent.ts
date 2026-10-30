import { useEffect, useState } from 'react';
import type { ShowroomCar } from '../data/showroomData';

export interface CmsBanner {
  id: string;
  slot: string;
  title: string;
  body: string;
  imageUrl: string;
  linkUrl: string;
}

export interface CmsDeal {
  id: string;
  title: string;
  imageUrl: string;
  budgetQuery: string;
  tag: string;
}

export interface CmsArticle {
  id: string;
  kind: 'review' | 'news' | 'video';
  title: string;
  summary: string;
  body: string;
  imageUrl: string;
  meta: string;
  videoUrl: string;
}

export interface CmsFaq {
  id: string;
  question: string;
  answer: string;
}

export interface CmsSiteContent {
  configured: {
    banners: boolean;
    bannerSlots: string[];
    deals: boolean;
    articles: boolean;
    faqs: boolean;
  };
  banners: CmsBanner[];
  deals: CmsDeal[];
  articles: CmsArticle[];
  faqs: CmsFaq[];
}

interface CmsVehiclesResponse {
  configured: boolean;
  vehicles: ShowroomCar[];
}

let contentPromise: Promise<CmsSiteContent | null> | null = null;
let vehiclesPromise: Promise<CmsVehiclesResponse | null> | null = null;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!response.ok) return null;
    return await response.json() as T;
  } catch {
    return null;
  }
}

export function loadCmsContent() {
  contentPromise ??= fetchJson<CmsSiteContent>('/api/site-content');
  return contentPromise;
}

export function loadCmsVehicles() {
  vehiclesPromise ??= fetchJson<CmsVehiclesResponse>('/api/vehicles');
  return vehiclesPromise;
}

export function useCmsContent() {
  const [content, setContent] = useState<CmsSiteContent | null>(null);
  useEffect(() => {
    let active = true;
    loadCmsContent().then((value) => { if (active) setContent(value); });
    return () => { active = false; };
  }, []);
  return content;
}

export function useCmsVehicles(fallback: ShowroomCar[]) {
  const [vehicles, setVehicles] = useState(fallback);
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    let active = true;
    loadCmsVehicles().then((value) => {
      if (!active || !value?.configured || !Array.isArray(value.vehicles)) return;
      setVehicles(value.vehicles);
      setConfigured(true);
    });
    return () => { active = false; };
  }, [fallback]);
  return { vehicles, configured };
}
