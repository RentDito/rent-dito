import type { Inquiry } from '@/entities/inquiry/model';
import type { Payment, PaymentMethod, Due } from '@/entities/payment/model';
import type { Property, PropertyType, Unit, UnitStatus } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import type { UserRole } from '@/entities/user/model';

export interface ListingFilters {
  query?: string;
  city?: string;
  types?: PropertyType[];
  minRent?: number;
  maxRent?: number;
  amenities?: string[];
}

export interface RentDitoRepository {
  listProperties(filters?: ListingFilters): Promise<Property[]>;
  getProperty(id: string): Promise<Property | null>;
  toggleSaved(propertyId: string): Promise<boolean>;
  listTenancies(): Promise<Tenancy[]>;
  listDues(): Promise<Due[]>;
  listPayments(): Promise<Payment[]>;
  listInquiries(role: UserRole): Promise<Inquiry[]>;
  submitInquiry(input: { propertyId: string; message: string }): Promise<Inquiry>;
  updateUnitStatus(input: { unitId: string; status: UnitStatus }): Promise<Unit>;
  recordPayment(input: {
    dueId: string;
    amount: number;
    method: PaymentMethod;
    source: 'landlord' | 'tenant';
  }): Promise<Payment>;
  resetDemoData(): void;
}
