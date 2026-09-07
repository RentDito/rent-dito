import { Link } from 'react-router-dom';

import { useDemoSession } from '@/app/demo/demoSessionContext';
import { routes } from '@/shared/lib/routes';
import { EmptyState } from '@/shared/ui/Feedback/Feedback';

const WORKSPACE_HOMES = {
  landlord: { to: routes.landlord.overview, label: 'Go to the landlord workspace' },
  tenant: { to: routes.tenant.overview, label: 'Go to the tenant workspace' },
} as const;

const NotFoundPage = () => {
  const { role } = useDemoSession();
  const workspace = role === 'guest' ? null : WORKSPACE_HOMES[role];

  return (
    <EmptyState
      headingLevel={2}
      title="We could not find that page"
      description="The link may be out of date, or the page may not exist in this prototype."
      action={
        <>
          <Link to={routes.home} data-navigation-link>
            Go to RentDito home
          </Link>
          {workspace ? (
            <Link to={workspace.to} data-navigation-link>
              {workspace.label}
            </Link>
          ) : null}
        </>
      }
    />
  );
};

export default NotFoundPage;
