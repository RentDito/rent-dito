import { z } from 'zod';

export const inquirySchema = z.object({
  message: z
    .string()
    .trim()
    .min(10, 'Please write at least 10 characters so the landlord can help.')
    .max(1000, 'Please keep your inquiry under 1000 characters.'),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
