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
