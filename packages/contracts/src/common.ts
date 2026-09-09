import { z } from 'zod';

export const featureKeySchema = z.enum([
  'accounts',
  'marketplace',
  'listing_authoring',
  'listing_moderation',
  'saved_inquiries',
  'tenancy_invitations',
  'tenant_billing',
  'payment_proofs',
  'landlord_operations',
]);

export type FeatureKey = z.infer<typeof featureKeySchema>;

export const apiProblemSchema = z.object({
  code: z.string(),
  message: z.string(),
  requestId: z.string(),
  fields: z.record(z.string(), z.string()).optional(),
});

export type ApiProblem = z.infer<typeof apiProblemSchema>;

export const featureResponseSchema = z.object({
  features: z.record(featureKeySchema, z.boolean()),
});

export type FeatureResponse = z.infer<typeof featureResponseSchema>;
