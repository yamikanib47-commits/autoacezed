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
