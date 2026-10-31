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
  agencyName: string;
  contactPerson: string;
  whatsappNumber: string;
  operatingTowns: string[];
  specializations: string[];
  experienceYears: string;
  notes?: string;
  status: string;
}

export type AnyLead = BuyLead | SellLead | AgentLead;

type LeadInput<T extends AnyLead> = Omit<T, 'id' | 'referenceId' | 'createdAt' | 'type' | 'status'>;

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
