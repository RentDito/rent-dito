import type { Inquiry } from '@/entities/inquiry/model';
import type { Payment, PaymentMethod, Due } from '@/entities/payment/model';
import type { Property, Unit, UnitStatus } from '@/entities/property/model';
import type { Tenancy } from '@/entities/tenancy/model';
import type { UserRole } from '@/entities/user/model';
import type { ListingFilters, RentDitoRepository } from '@/shared/api/contracts';
import { getDefaultStorage, type StorageAdapter } from '@/shared/lib/storage';

import { createSeedData, CURRENT_LANDLORD_ID, CURRENT_TENANT_ID, DEMO_DATA_VERSION, type DemoData } from './seed';

const STORAGE_KEY = 'rentdito:demo-data';

interface StoredDemoData {
  version: number;
  data: DemoData;
}

interface RepositoryOptions {
  delayMs?: number;
}

const clone = <T>(value: T): T => structuredClone(value);

function isStoredDemoData(value: unknown): value is StoredDemoData {
  return typeof value === 'object' && value !== null && 'version' in value && 'data' in value && (value as { version: unknown }).version === DEMO_DATA_VERSION;
}

export class MockRentDitoRepository implements RentDitoRepository {
  private data: DemoData;
  private readonly delayMs: number;

  constructor(
    private readonly storage: StorageAdapter = getDefaultStorage(),
    options: RepositoryOptions = {},
  ) {
    this.delayMs = options.delayMs ?? 250;
    this.data = this.loadData();
  }

  async listProperties(filters: ListingFilters = {}): Promise<Property[]> {
    await this.wait();
    const query = filters.query?.trim().toLocaleLowerCase('en-PH');
    const city = filters.city?.trim().toLocaleLowerCase('en-PH');
    const properties = this.data.properties.filter((property) => {
      const hasMatchingQuery = !query || [property.title, property.city, property.barangay, property.type].join(' ').toLocaleLowerCase('en-PH').includes(query);
      const hasMatchingCity = !city || property.city.toLocaleLowerCase('en-PH') === city;
      const hasMatchingType = !filters.types?.length || filters.types.includes(property.type);
      const rents = property.units.map((unit) => unit.monthlyRent);
      const hasRentInRange = (!filters.minRent || rents.some((rent) => rent >= filters.minRent!)) && (!filters.maxRent || rents.some((rent) => rent <= filters.maxRent!));
      const hasAmenities = !filters.amenities?.length || filters.amenities.every((amenity) => property.amenities.some((propertyAmenity) => propertyAmenity.toLocaleLowerCase('en-PH') === amenity.toLocaleLowerCase('en-PH')));
      return hasMatchingQuery && hasMatchingCity && hasMatchingType && hasRentInRange && hasAmenities;
    });
    return clone(properties);
  }

  async getProperty(id: string): Promise<Property | null> {
    await this.wait();
    return clone(this.data.properties.find((property) => property.id === id) ?? null);
  }

  async toggleSaved(propertyId: string): Promise<boolean> {
    await this.wait();
    this.getPropertyOrThrow(propertyId);
    const tenant = this.data.users.find((user) => user.id === CURRENT_TENANT_ID);
    if (!tenant) throw new Error('Current tenant is unavailable.');
    const wasSaved = tenant.savedPropertyIds.includes(propertyId);
    tenant.savedPropertyIds = wasSaved ? tenant.savedPropertyIds.filter((id) => id !== propertyId) : [...tenant.savedPropertyIds, propertyId];
    this.persist();
    return !wasSaved;
  }

  async listSavedPropertyIds(): Promise<string[]> {
    await this.wait();
    const tenant = this.data.users.find((user) => user.id === CURRENT_TENANT_ID);
    return [...(tenant?.savedPropertyIds ?? [])];
  }

  async listTenancies(): Promise<Tenancy[]> {
    await this.wait();
    return clone(this.data.tenancies);
  }

  async listDues(): Promise<Due[]> {
    await this.wait();
    return clone(this.data.dues);
  }

  async listPayments(): Promise<Payment[]> {
    await this.wait();
    return clone(this.data.payments);
  }

  async listInquiries(role: UserRole): Promise<Inquiry[]> {
    await this.wait();
    return clone(this.data.inquiries.filter((inquiry) => role === 'tenant' ? inquiry.tenantId === CURRENT_TENANT_ID : inquiry.landlordId === CURRENT_LANDLORD_ID));
  }

  async submitInquiry(input: { propertyId: string; message: string }): Promise<Inquiry> {
    await this.wait();
    const property = this.getPropertyOrThrow(input.propertyId);
    const message = input.message.trim();
    if (!message) throw new Error('Please enter an inquiry message.');
    const inquiry: Inquiry = {
      id: `inquiry-${crypto.randomUUID()}`,
      propertyId: property.id,
      tenantId: CURRENT_TENANT_ID,
      landlordId: property.landlordId,
      message,
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    this.data.inquiries.unshift(inquiry);
    this.persist();
    return clone(inquiry);
  }

  async replyToInquiry(input: { inquiryId: string; reply: string }): Promise<Inquiry> {
    await this.wait();
    const inquiry = this.data.inquiries.find((candidate) => candidate.id === input.inquiryId);
    if (!inquiry) throw new Error('Inquiry not found.');
    const reply = input.reply.trim();
    if (!reply) throw new Error('Please enter a reply.');
    inquiry.reply = reply;
    inquiry.repliedAt = new Date().toISOString();
    inquiry.status = 'replied';
    this.persist();
    return clone(inquiry);
  }

  async updateUnitStatus(input: { unitId: string; status: UnitStatus }): Promise<Unit> {
    await this.wait();
    const unit = this.findUnit(input.unitId);
    if (!unit) throw new Error('Unit not found.');
    const activeTenancy = this.data.tenancies.some((tenancy) => tenancy.unitId === unit.id && tenancy.status === 'active');
    if (input.status === 'available' && activeTenancy) throw new Error('End the active tenancy before making this unit available.');
    unit.status = input.status;
    this.persist();
    return clone(unit);
  }

  async recordPayment(input: { dueId: string; amount: number; method: PaymentMethod; source: 'landlord' | 'tenant' }): Promise<Payment> {
    await this.wait();
    const due = this.data.dues.find((candidate) => candidate.id === input.dueId);
    if (!due) throw new Error('Due not found.');
    if (!Number.isFinite(input.amount) || input.amount <= 0 || input.amount > due.amount - due.paidAmount) throw new Error('Payment amount must not exceed the remaining balance.');
    const payment: Payment = {
      id: `payment-${crypto.randomUUID()}`,
      dueId: due.id,
      tenancyId: due.tenancyId,
      amount: input.amount,
      method: input.method,
      source: input.source,
      recordedAt: new Date().toISOString(),
    };
    due.paidAmount += input.amount;
    this.data.payments.unshift(payment);
    this.persist();
    return clone(payment);
  }

  resetDemoData(): void {
    this.data = createSeedData();
    this.persist();
  }

  private loadData(): DemoData {
    const raw = this.storage.getItem(STORAGE_KEY);
    if (!raw) return this.restoreSeedData();
    try {
      const stored: unknown = JSON.parse(raw);
      if (isStoredDemoData(stored)) return clone(stored.data);
    } catch {
      // Invalid local data is replaced with a known, versioned seed.
    }
    return this.restoreSeedData();
  }

  private restoreSeedData(): DemoData {
    const data = createSeedData();
    this.storage.setItem(STORAGE_KEY, JSON.stringify({ version: DEMO_DATA_VERSION, data }));
    return data;
  }

  private persist(): void {
    this.storage.setItem(STORAGE_KEY, JSON.stringify({ version: DEMO_DATA_VERSION, data: this.data }));
  }

  private getPropertyOrThrow(id: string): Property {
    const property = this.data.properties.find((candidate) => candidate.id === id);
    if (!property) throw new Error('Property not found.');
    return property;
  }

  private findUnit(id: string): Unit | undefined {
    return this.data.properties.flatMap((property) => property.units).find((unit) => unit.id === id);
  }

  private async wait(): Promise<void> {
    if (this.delayMs > 0) await new Promise<void>((resolve) => setTimeout(resolve, this.delayMs));
  }
}

export function createMockRepository(storage?: StorageAdapter, options?: RepositoryOptions): RentDitoRepository {
  return new MockRentDitoRepository(storage, options);
}
