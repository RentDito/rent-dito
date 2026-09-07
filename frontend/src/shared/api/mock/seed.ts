import type { Inquiry } from '@/entities/inquiry/model';
import type { Due, Payment } from '@/entities/payment/model';
import type { Property } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import type { User } from '@/entities/user/model';

export interface DemoData {
  users: User[];
  properties: Property[];
  tenancies: Tenancy[];
  dues: Due[];
  payments: Payment[];
  inquiries: Inquiry[];
}

export const DEMO_DATA_VERSION = 1;
export const CURRENT_TENANT_ID = 'user-tenant-01';
export const CURRENT_LANDLORD_ID = 'user-landlord-01';

const properties: Property[] = [
  {
    id: 'prop-makati-01',
    landlordId: CURRENT_LANDLORD_ID,
    title: 'Sampaguita Residences',
    type: 'condominium',
    description: 'A bright, practical home close to Makati offices and the MRT.',
    address: '112 Dela Rosa Street',
    barangay: 'Legazpi Village',
    city: 'Makati',
    province: 'Metro Manila',
    amenities: ['24/7 security', 'Gym', 'Pool', 'Pet-friendly'],
    imageUrls: [],
    units: [
      { id: 'unit-occupied-01', propertyId: 'prop-makati-01', name: 'Unit 6A', bedrooms: 1, bathrooms: 1, floorAreaSqm: 32, monthlyRent: 18_000, deposit: 36_000, status: 'occupied' },
      { id: 'unit-makati-8b', propertyId: 'prop-makati-01', name: 'Unit 8B', bedrooms: 1, bathrooms: 1, floorAreaSqm: 35, monthlyRent: 21_000, deposit: 42_000, status: 'available' },
    ],
    createdAt: '2026-06-15T09:00:00+08:00',
  },
  {
    id: 'prop-quezon-city-02',
    landlordId: CURRENT_LANDLORD_ID,
    title: 'Maple Court Apartments',
    type: 'apartment',
    description: 'Quiet two-bedroom apartments near Katipunan and UP Diliman.',
    address: '28 Mahinhin Street',
    barangay: 'Teacher’s Village East',
    city: 'Quezon City',
    province: 'Metro Manila',
    amenities: ['Gated compound', 'Laundry area', 'Parking'],
    imageUrls: [],
    units: [{ id: 'unit-qc-02', propertyId: 'prop-quezon-city-02', name: 'Unit 2', bedrooms: 2, bathrooms: 1, floorAreaSqm: 54, monthlyRent: 24_000, deposit: 48_000, status: 'available' }],
    createdAt: '2026-07-03T09:00:00+08:00',
  },
  {
    id: 'prop-pasig-03',
    landlordId: 'user-landlord-02',
    title: 'Acacia Family Home',
    type: 'house',
    description: 'A three-bedroom home for growing families in a leafy Pasig neighbourhood.',
    address: '14 Acacia Lane',
    barangay: 'Kapitolyo',
    city: 'Pasig',
    province: 'Metro Manila',
    amenities: ['Carport', 'Garden', 'Gated village'],
    imageUrls: [],
    units: [{ id: 'unit-pasig-03', propertyId: 'prop-pasig-03', name: 'Whole house', bedrooms: 3, bathrooms: 2, floorAreaSqm: 120, monthlyRent: 45_000, deposit: 90_000, status: 'available' }],
    createdAt: '2026-07-20T09:00:00+08:00',
  },
  {
    id: 'prop-cebu-04',
    landlordId: 'user-landlord-03',
    title: 'Lapu-Lapu Study House',
    type: 'bedspace',
    description: 'Clean shared rooms designed for students and early-career professionals.',
    address: '7 Orchid Road',
    barangay: 'Lahug',
    city: 'Cebu City',
    province: 'Cebu',
    amenities: ['Wi-Fi', 'Study lounge', 'CCTV'],
    imageUrls: [],
    units: [{ id: 'unit-cebu-04', propertyId: 'prop-cebu-04', name: 'Bed A', bedrooms: 1, bathrooms: 1, floorAreaSqm: 12, monthlyRent: 6_500, deposit: 6_500, status: 'available' }],
    createdAt: '2026-08-01T09:00:00+08:00',
  },
  {
    id: 'prop-davao-05',
    landlordId: 'user-landlord-04',
    title: 'Durian Grove Apartments',
    type: 'apartment',
    description: 'A breezy Davao apartment with practical finishes and room for remote work.',
    address: '83 Malvar Street',
    barangay: 'Poblacion District',
    city: 'Davao City',
    province: 'Davao del Sur',
    amenities: ['Fibre-ready', 'Laundry area', 'Motorcycle parking'],
    imageUrls: [],
    units: [{ id: 'unit-davao-05', propertyId: 'prop-davao-05', name: 'Unit 3', bedrooms: 1, bathrooms: 1, floorAreaSqm: 38, monthlyRent: 13_500, deposit: 27_000, status: 'available' }],
    createdAt: '2026-08-04T09:00:00+08:00',
  },
  {
    id: 'prop-muntinlupa-06',
    landlordId: 'user-landlord-05',
    title: 'Southpoint Garden Flats',
    type: 'condominium',
    description: 'A peaceful Alabang condominium with green views and easy access to commerce.',
    address: '19 Commerce Avenue',
    barangay: 'Alabang',
    city: 'Muntinlupa',
    province: 'Metro Manila',
    amenities: ['Pool', 'Co-working area', '24/7 security'],
    imageUrls: [],
    units: [{ id: 'unit-muntinlupa-06', propertyId: 'prop-muntinlupa-06', name: 'Unit 12C', bedrooms: 2, bathrooms: 2, floorAreaSqm: 68, monthlyRent: 34_000, deposit: 68_000, status: 'available' }],
    createdAt: '2026-08-11T09:00:00+08:00',
  },
];

const seed: DemoData = {
  users: [
    { id: CURRENT_TENANT_ID, role: 'tenant', name: 'Mateo Cruz', email: 'mateo.cruz@example.test', phone: '0917 555 0184', savedPropertyIds: ['prop-cebu-04'] },
    { id: CURRENT_LANDLORD_ID, role: 'landlord', name: 'Angela Santos', email: 'angela.santos@example.test', phone: '0917 555 0216', savedPropertyIds: [] },
  ],
  properties,
  tenancies: [{ id: 'tenancy-active-01', tenantId: CURRENT_TENANT_ID, landlordId: CURRENT_LANDLORD_ID, propertyId: 'prop-makati-01', unitId: 'unit-occupied-01', status: 'active', startDate: '2026-01-01', endDate: '2026-12-31', monthlyRent: 18_000, paymentDueDay: 1 }],
  dues: [
    { id: 'due-august-01', tenancyId: 'tenancy-active-01', label: 'August 2026 rent', amount: 18_000, paidAmount: 0, dueDate: '2026-08-01' },
    { id: 'due-september-01', tenancyId: 'tenancy-active-01', label: 'September 2026 rent', amount: 18_000, paidAmount: 18_000, dueDate: '2026-09-01' },
    { id: 'due-september-15', tenancyId: 'tenancy-active-01', label: 'Utility top-up', amount: 2_200, paidAmount: 0, dueDate: '2026-09-15' },
  ],
  payments: [{ id: 'payment-01', dueId: 'due-september-01', tenancyId: 'tenancy-active-01', amount: 18_000, method: 'gcash', source: 'tenant', recordedAt: '2026-08-30T18:12:00+08:00' }],
  inquiries: [{ id: 'inquiry-01', propertyId: 'prop-cebu-04', tenantId: CURRENT_TENANT_ID, landlordId: 'user-landlord-03', message: 'Is the study lounge open in the evenings?', status: 'replied', createdAt: '2026-08-29T10:00:00+08:00', reply: 'Yes, it is open until 10 pm daily.', repliedAt: '2026-08-29T13:15:00+08:00' }],
};

export function createSeedData(): DemoData {
  return structuredClone(seed);
}
