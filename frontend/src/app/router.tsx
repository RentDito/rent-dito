import {
  Link,
  Navigate,
  createBrowserRouter,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

import { useDemoSession } from '@/app/demo/demoSessionContext';
import { PublicLayout } from '@/app/layouts/PublicLayout';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import LandlordDashboardPage from '@/pages/landlord/LandlordDashboardPage';
import LandlordInquiriesPage from '@/pages/landlord/LandlordInquiriesPage';
import LandlordPaymentsPage from '@/pages/landlord/LandlordPaymentsPage';
import PropertiesPage from '@/pages/landlord/PropertiesPage';
import PropertyDetailPage from '@/pages/landlord/PropertyDetailPage';
import TenantDetailPage from '@/pages/landlord/TenantDetailPage';
import TenantsPage from '@/pages/landlord/TenantsPage';
import HomePage from '@/pages/marketplace/HomePage';
import ListingDetailPage from '@/pages/marketplace/ListingDetailPage';
import SavedPage from '@/pages/marketplace/SavedPage';
import CurrentRentalPage from '@/pages/tenant/CurrentRentalPage';
import PayDuePage from '@/pages/tenant/PayDuePage';
import ReceiptPage from '@/pages/tenant/ReceiptPage';
import TenantDashboardPage from '@/pages/tenant/TenantDashboardPage';
import TenantInquiriesPage from '@/pages/tenant/TenantInquiriesPage';
import TenantPaymentsPage from '@/pages/tenant/TenantPaymentsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import OfflinePage from '@/pages/OfflinePage';
import RegisterPage from '@/pages/auth/RegisterPage';
import SettingsPage from '@/pages/SettingsPage';
import SignInPage from '@/pages/auth/SignInPage';
import { routePatterns, routes } from '@/shared/lib/routes';
import { Button } from '@/shared/ui/Button/Button';
import { EmptyState } from '@/shared/ui/Feedback/Feedback';

/** Safe route-level fallback. Unknown paths still get the not-found page. */
const RouteErrorFallback = () => {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFoundPage />;
  }

  return (
    <EmptyState
      headingLevel={2}
      title="This page ran into a problem"
      description="Your prototype data is unchanged. Reloading usually clears this."
      action={
        <>
          <Button onClick={() => window.location.reload()}>Reload this page</Button>
          <Link to={routes.home} data-navigation-link>
            Go to RentDito home
          </Link>
        </>
      }
    />
  );
};

/**
 * Shell for routes that belong to whoever is viewing: a landlord and a tenant
 * each keep their own workspace navigation, and a guest stays on the public
 * shell.
 */
const RoleShell = () => {
  const { role } = useDemoSession();
  return role === 'guest' ? <PublicLayout /> : <WorkspaceLayout workspace={role} />;
};

/** Keeps shared and bookmarked search URLs working after browsing moved to Home. */
const LegacyListingsRedirect = () => {
  const { search, hash } = useLocation();
  return <Navigate replace to={{ pathname: routes.home, search, hash }} />;
};

export const appRoutes: RouteObject[] = [
  {
    element: <RoleShell />,
    errorElement: <RouteErrorFallback />,
    children: [{ path: routes.settings, element: <SettingsPage /> }],
  },
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: routes.home, element: <HomePage /> },
      { path: routes.listings, element: <LegacyListingsRedirect /> },
      { path: routePatterns.listingDetail, element: <ListingDetailPage /> },
      { path: routes.saved, element: <SavedPage /> },
      { path: routes.signIn, element: <SignInPage /> },
      { path: routes.register, element: <RegisterPage /> },
      { path: routes.offline, element: <OfflinePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <WorkspaceLayout workspace="landlord" />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: routes.landlord.overview, element: <LandlordDashboardPage /> },
      { path: routes.landlord.properties, element: <PropertiesPage /> },
      { path: routePatterns.landlordPropertyDetail, element: <PropertyDetailPage /> },
      { path: routes.landlord.tenants, element: <TenantsPage /> },
      { path: routePatterns.landlordTenantDetail, element: <TenantDetailPage /> },
      { path: routes.landlord.payments, element: <LandlordPaymentsPage /> },
      { path: routes.landlord.inquiries, element: <LandlordInquiriesPage /> },
    ],
  },
  {
    element: <WorkspaceLayout workspace="tenant" />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: routes.tenant.overview, element: <TenantDashboardPage /> },
      { path: routes.tenant.rental, element: <CurrentRentalPage /> },
      { path: routes.tenant.payments, element: <TenantPaymentsPage /> },
      { path: routePatterns.tenantPayDue, element: <PayDuePage /> },
      { path: routePatterns.tenantReceipt, element: <ReceiptPage /> },
      { path: routes.tenant.inquiries, element: <TenantInquiriesPage /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(appRoutes);
