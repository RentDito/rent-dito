import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import { rentDitoRepository } from '@/app/repositories';
import { OFFLINE_ACTION_MESSAGE, useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { Button } from '@/shared/ui/Button/Button';
import { Field } from '@/shared/ui/Field/Field';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { useToast } from '@/shared/ui/Toast/toastContext';

import { inquiryKeys } from './inquiryKeys';
import { inquirySchema, type InquiryFormValues } from './schema';
import styles from './InquiryForm.module.css';

export interface InquiryFormProps {
  propertyId: string;
  propertyTitle: string;
  /** Context line so the tenant can see exactly what they are asking about. */
  contextLine: string;
  onSent: () => void;
  onCancel?: () => void;
}

export const InquiryForm = ({
  propertyId,
  propertyTitle,
  contextLine,
  onSent,
  onCancel,
}: InquiryFormProps) => {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { showToast } = useToast();

  const form = useForm<InquiryFormValues>({
    resolver: zodResolver(inquirySchema),
    defaultValues: { message: '' },
    mode: 'onSubmit',
  });

  const send = useMutation({
    mutationFn: (values: InquiryFormValues) =>
      rentDitoRepository.submitInquiry({ propertyId, message: values.message }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: inquiryKeys.all });
      showToast({ title: 'Inquiry saved', description: propertyTitle });
      form.reset();
      onSent();
    },
  });

  return (
    <form
      className={styles.form}
      onSubmit={form.handleSubmit((values) => send.mutate(values))}
      noValidate
    >
      <p className={styles.context}>{contextLine}</p>

      <InlineAlert tone="info" title="Prototype inquiry">
        Nothing is sent to a real landlord. Your message is stored on this device so you can see how
        the conversation would look.
      </InlineAlert>

      <Field
        label="Message"
        required
        hint="Mention your move-in date and how many people will live there."
        error={form.formState.errors.message?.message}
      >
        <textarea {...form.register('message')} rows={5} />
      </Field>

      {!isOnline ? <InlineAlert tone="warning" title={OFFLINE_ACTION_MESSAGE} /> : null}

      {send.isError ? (
        <InlineAlert tone="danger" title="We could not save your inquiry">
          Nothing was recorded. Please try again.
        </InlineAlert>
      ) : null}

      <div className={styles.actions}>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" loading={send.isPending} disabled={!isOnline}>
          Send inquiry
        </Button>
      </div>
    </form>
  );
};
