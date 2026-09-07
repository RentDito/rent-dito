import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useDemoSession } from '@/app/demo/demoSessionContext';
import { routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { useToast } from '@/shared/ui/Toast/toastContext';

/**
 * Restores the versioned seed data. Destructive for anything the reviewer
 * changed, so it always asks first and says exactly what will be lost.
 */
export const ResetDemoDataButton = () => {
  const { role, reset } = useDemoSession();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);

  const roleHome =
    role === 'landlord'
      ? routes.landlord.overview
      : role === 'tenant'
        ? routes.tenant.overview
        : routes.home;

  const confirm = async () => {
    setResetting(true);
    try {
      await reset();
      showToast({ title: 'Demo data reset', description: 'Every prototype change was undone.' });
      setConfirming(false);
      navigate(roleHome);
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <Button variant="danger" onClick={() => setConfirming(true)}>
        Reset demo data
      </Button>

      <Dialog
        open={confirming}
        title="Reset all prototype changes?"
        onClose={() => setConfirming(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Keep my changes
            </Button>
            <Button variant="danger" loading={resetting} onClick={() => void confirm()}>
              Reset everything now
            </Button>
          </>
        }
      >
        <InlineAlert tone="warning" title="This cannot be undone">
          Saved listings, inquiries and replies, unit status changes, and recorded payments all go
          back to the original demo data. Nothing outside this prototype is affected.
        </InlineAlert>
      </Dialog>
    </>
  );
};
