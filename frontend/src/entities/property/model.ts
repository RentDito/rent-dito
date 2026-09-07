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
  imageUrls: string[];
  units: Unit[];
  createdAt: string;
}
