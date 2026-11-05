export interface BuyLead {
  id: string;
  referenceId: string;
  type: 'buy';
  createdAt: string;
  make: string;
  model: string;
  vehicleDescription?: string;
  yearRange?: string;
  budgetZMW: string;
  location: string;
  urgency: string;
  customerName: string;
  whatsappNumber: string;
  notes?: string;
  preferredFuel?: string;
  preferredTransmission?: string;
  preferredBodyStyle?: string;
  preferredColour?: string;
  buyingIntent?: 'specific' | 'guidance';
  budgetBasis?: 'total' | 'monthly';
  status: string;
}

export interface SellLead {
  id: string;
  referenceId: string;
  type: 'sell';
  createdAt: string;
  make: string;
  model: string;
  year: string;
  mileage: string;
  transmission: string;
  fuelType: string;
  condition: string;
  askingPriceZMW: string;
  location: string;
  regNumber?: string;
  sellerName: string;
  whatsappNumber: string;
  photosCount: number;
  status: string;
}

export interface AgentLead {
  id: string;
  referenceId: string;
  type: 'agent';
  createdAt: string;
  fullName: string;
  whatsappNumber: string;
  location: string;
  email: string;
  cityTown: string;
  province: string;
  experienceRange: string;
  professionalRole: string;
  otherProfessionalRole?: string;
  companyName: string;
  operatesIndependently: boolean;
  vehicleTypes: string[];
  otherVehicleTypes?: string;
  sourcingRegions: string[];
  services: string[];
  monthlyVolume: string;
  auctionAccess: string;
  inspectionCapability: string;
  availability: string;
  additionalInformation?: string;
  privacyConsent: boolean;
  privacyNoticeVersion: string;
  privacyConsentAt?: string;
  status: string;
}

export type AnyLead = BuyLead | SellLead | AgentLead;

type LeadInput<T extends AnyLead> = Omit<T, 'id' | 'referenceId' | 'createdAt' | 'type' | 'status' | 'privacyNoticeVersion' | 'privacyConsentAt'> & (T extends AgentLead ? { submissionKey: string } : { submissionKey?: string });

export interface PendingSubmissionKey {
  fingerprint: string;
  key: string;
}

export function submissionKeyFor(payload: unknown, pending: PendingSubmissionKey | null): PendingSubmissionKey {
  const fingerprint = JSON.stringify(payload) ?? '';
  return pending?.fingerprint === fingerprint ? pending : { fingerprint, key: createSubmissionKey() };
}

export function createSubmissionKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

async function submitLead<T extends AnyLead>(kind: T['type'], payload: LeadInput<T>): Promise<T> {
  const response = await fetch(`/api/leads/${kind}`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => null) as { lead?: T; error?: string } | null;
  if (!response.ok || !data?.lead) {
    throw new Error(data?.error || 'Your request could not be submitted. Please try again.');
  }
  return data.lead;
}

export function submitBuyLead(payload: LeadInput<BuyLead>): Promise<BuyLead> {
  return submitLead<BuyLead>('buy', payload);
}

export function submitSellLead(payload: LeadInput<SellLead>): Promise<SellLead> {
  return submitLead<SellLead>('sell', payload);
}

export function submitAgentLead(payload: LeadInput<AgentLead>): Promise<AgentLead> {
  return submitLead<AgentLead>('agent', payload);
}
