/**
 * Every navigable path in one place, so navigation, redirects, and tests share
 * a single source of truth instead of repeating string literals.
 */
export const routes = {
  home: '/',
  listings: '/listings',
  listingDetail: (propertyId: string) => `/listings/${propertyId}`,
  saved: '/saved',

  signIn: '/auth/sign-in',
  register: '/auth/register',
  settings: '/settings',
  offline: '/offline',

  landlord: {
    overview: '/landlord',
    properties: '/landlord/properties',
    propertyDetail: (propertyId: string) => `/landlord/properties/${propertyId}`,
    tenants: '/landlord/tenants',
    tenantDetail: (tenancyId: string) => `/landlord/tenants/${tenancyId}`,
    payments: '/landlord/payments',
    inquiries: '/landlord/inquiries',
  },

  tenant: {
    overview: '/tenant',
    rental: '/tenant/rental',
    payments: '/tenant/payments',
    payDue: (dueId: string) => `/tenant/payments/${dueId}/pay`,
    receipt: (paymentId: string) => `/tenant/receipts/${paymentId}`,
    inquiries: '/tenant/inquiries',
  },
} as const;

/** Route patterns, used where React Router needs the parameterised form. */
export const routePatterns = {
  listingDetail: '/listings/:propertyId',
  landlordPropertyDetail: '/landlord/properties/:propertyId',
  landlordTenantDetail: '/landlord/tenants/:tenancyId',
  tenantPayDue: '/tenant/payments/:dueId/pay',
  tenantReceipt: '/tenant/receipts/:paymentId',
} as const;
