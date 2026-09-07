import { DEMO_ROLE_LABELS, useDemoSession } from '@/app/demo/demoSessionContext';
import { ResetDemoDataButton } from '@/features/demo-session/ResetDemoDataButton';
import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { Card } from '@/shared/ui/Card/Card';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';
import { StatusBadge } from '@/shared/ui/StatusBadge/StatusBadge';

import styles from './settings.module.css';

const DEMO_PROFILES = {
  guest: { name: 'Guest visitor', detail: 'Browsing without a demo account.' },
  tenant: { name: 'Mateo Cruz', detail: 'mateo.cruz@example.test · 0917 555 0184' },
  landlord: { name: 'Angela Santos', detail: 'angela.santos@example.test · 0917 555 0216' },
} as const;

const SettingsPage = () => {
  const { role } = useDemoSession();
  const isOnline = useOnlineStatus();
  const profile = DEMO_PROFILES[role];
  const installed =
    typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <div>
          <h1>Settings</h1>
          <p className={styles.pageContext}>
            Who you are viewing as, how the prototype is installed, and how to start over.
          </p>
        </div>
      </header>

      <Card title="Demo profile">
        <dl className={styles.facts}>
          <div>
            <dt>Viewing as</dt>
            <dd>{DEMO_ROLE_LABELS[role]}</dd>
          </div>
          <div>
            <dt>Name</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Contact</dt>
            <dd>{profile.detail}</dd>
          </div>
        </dl>
        <InlineAlert tone="info" title="These details are fictional">
          Every person, property, and payment in RentDito is demonstration data. Switch roles from
          the header at any time.
        </InlineAlert>
      </Card>

      <Card title="App and connection">
        <dl className={styles.facts}>
          <div>
            <dt>Connection</dt>
            <dd>
              <StatusBadge tone={isOnline ? 'success' : 'warning'}>
                {isOnline ? 'Online' : 'Offline'}
              </StatusBadge>
            </dd>
          </div>
          <div>
            <dt>Installed as an app</dt>
            <dd>{installed ? 'Yes, running standalone' : 'Not installed'}</dd>
          </div>
          <div>
            <dt>Data storage</dt>
            <dd>This device only</dd>
          </div>
        </dl>
        <p className={styles.note}>
          RentDito can be installed from your browser&apos;s menu. Installed or not, it never
          queues an inquiry or payment while you are offline — actions wait for you to reconnect.
        </p>
      </Card>

      <Card
        title="Reset demo data"
        description="Put every listing, inquiry, unit status, and payment back to the original demo data."
      >
        <ResetDemoDataButton />
      </Card>
    </div>
  );
};

export default SettingsPage;
