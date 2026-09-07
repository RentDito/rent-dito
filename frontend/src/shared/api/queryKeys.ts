/**
 * Query keys for workspace reads. Listing and inquiry keys live with their own
 * features; these cover the records both workspaces share.
 */
export const dataKeys = {
  tenancies: ['tenancies'] as const,
  dues: ['dues'] as const,
  payments: ['payments'] as const,
};
