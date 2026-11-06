export const SHOWROOM_OFFER_FILTERS = ['new-stock', 'under-100000', 'under-150000', 'over-250000', 'open-budget'] as const;
export type ShowroomOfferFilter = typeof SHOWROOM_OFFER_FILTERS[number];

export function isShowroomOfferFilter(value: string | null | undefined): value is ShowroomOfferFilter {
  return SHOWROOM_OFFER_FILTERS.includes(value as ShowroomOfferFilter);
}

export interface ShowroomCar {
  id: string;
  name: string;
  make: string;
  model: string;
  trim: string;
  bodyStyle: 'SUV' | 'Hatchback' | 'Saloon' | 'Estate' | 'Double Cab' | 'Van' | 'Coupe';
  fuelType: 'Petrol' | 'Diesel' | 'Hybrid' | 'Electric';
  gearbox: 'Automatic' | 'Manual';
  engineSize: string;
  year: number;
  mileageKm: number;
  priceZMW: number;
  monthlyZMW: number;
  location: string;
  dealer: string;
  listedAt?: string | null;
  isTopRated: boolean;
  isAd: boolean;
  condition: 'Used' | 'Brand New';
  images: string[];
  features: string[];
  lifestyleTags: ('most-off-rrp' | 'in-stock' | 'city' | 'outdoors' | 'family')[];
  bhp?: number;
  ownersCount?: number;
  insuranceGroup?: string;
  warrantyText?: string;
  dealerPhone?: string;
  dealerReviewsCount?: number;
  dealerRating?: number;
  dealerAddress?: string;
  fullDescription?: string;
  dealId?: string;
  detailedSpecs?: {
    category: string;
    items: { label: string; value: string }[];
  }[];
}
