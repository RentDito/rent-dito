import { CloudOff } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useOnlineStatus } from '@/shared/hooks/useOnlineStatus';
import { routes } from '@/shared/lib/routes';
import { Card } from '@/shared/ui/Card/Card';
import { InlineAlert } from '@/shared/ui/Feedback/Feedback';

import styles from './settings.module.css';

const OfflinePage = () => {
  const isOnline = useOnlineStatus();

  return (
    <div className={styles.offlinePage}>
      <Card
        title={isOnline ? 'You are back online' : 'You are offline'}
        description={
          isOnline
            ? 'Your connection is working again, so everything is available.'
            : 'RentDito is installed, so the pages you already opened still work.'
        }
      >
        <p className={styles.note}>
          <CloudOff aria-hidden="true" /> {isOnline ? 'Connected' : 'No connection detected'}
        </p>

        <p className={styles.note}>What you can still do offline:</p>
        <ul className={styles.offlineList}>
          <li>Read listings, rental details, and records you have already opened</li>
          <li>Review your dues, payment history, and receipts stored on this device</li>
        </ul>

        <p className={styles.note}>What needs a connection:</p>
        <ul className={styles.offlineList}>
          <li>Sending an inquiry or a landlord reply</li>
          <li>Changing a unit&apos;s status</li>
          <li>Recording or simulating a payment</li>
        </ul>

        <InlineAlert tone="warning" title="Nothing is queued while you are offline">
          RentDito never pretends an action succeeded. Anything you start offline stays unsent
          until you reconnect and try again.
        </InlineAlert>

        <div className={styles.offlineActions}>
          <Link to={routes.home} data-navigation-link>
            Go to RentDito home
          </Link>
          <Link to={routes.listings} data-navigation-link>
            Browse cached rentals
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default OfflinePage;
