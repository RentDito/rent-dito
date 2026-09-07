import type { Tone } from '@/shared/types/status';

export type PropertyType = 'apartment' | 'condominium' | 'house' | 'bedspace';

export type UnitStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface Unit {
  id: string;
  propertyId: string;
  name: string;
  bedrooms: number;
  bathrooms: number;
  floorAreaSqm: number;
  monthlyRent: number;
  deposit: number;
  status: UnitStatus;
}

export interface Property {
  id: string;
  landlordId: string;
  title: string;
  type: PropertyType;
  description: string;
  address: string;
  barangay: string;
  city: string;
  province: string;
  amenities: string[];
  houseRules: string[];
  imageUrls: string[];
  units: Unit[];
  /** Earliest move-in date advertised for this property. */
  availableFrom: string;
  /** Landlord facts the marketplace shows as trust cues. */
  landlordName: string;
  landlordVerified: boolean;
  createdAt: string;
}

/** Units a tenant could actually take today. */
export const availableUnits = (property: Property) =>
  property.units.filter((unit) => unit.status === 'available');

/** Lowest advertised rent, preferring units that are actually available. */
export const startingRent = (property: Property) => {
  const candidates = availableUnits(property);
  const units = candidates.length > 0 ? candidates : property.units;
  return Math.min(...units.map((unit) => unit.monthlyRent));
};

/** "1" or "1-3", describing the bedroom counts across a property's units. */
export const bedroomRange = (property: Property) => {
  const bedrooms = property.units.map((unit) => unit.bedrooms);
  const low = Math.min(...bedrooms);
  const high = Math.max(...bedrooms);
  return low === high ? `${low}` : `${low}–${high}`;
};

/** One presentation contract for unit status, shared by every surface. */
export const UNIT_STATUS_LABELS: Record<UnitStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  maintenance: 'Maintenance',
};

export const UNIT_STATUS_TONES: Record<UnitStatus, Tone> = {
  available: 'success',
  occupied: 'neutral',
  reserved: 'warning',
  maintenance: 'info',
};

/** Plain-language effect of each status, shown before a landlord confirms. */
export const UNIT_STATUS_CONSEQUENCES: Record<UnitStatus, string> = {
  available: 'The unit appears in public search results and can receive inquiries.',
  occupied: 'The unit is hidden from search and counts towards occupancy.',
  reserved: 'The unit is hidden from search and held for a specific tenant.',
  maintenance: 'The unit is hidden from search and excluded from expected rent.',
};

export const UNIT_STATUS_ORDER: UnitStatus[] = ['available', 'reserved', 'occupied', 'maintenance'];
