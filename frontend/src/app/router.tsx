import { Link, createBrowserRouter, isRouteErrorResponse, useRouteError } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

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
import ListingsPage from '@/pages/marketplace/ListingsPage';
import SavedPage from '@/pages/marketplace/SavedPage';
import NotFoundPage from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
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

export const appRoutes: RouteObject[] = [
  {
    element: <PublicLayout />,
    errorElement: <RouteErrorFallback />,
    children: [
      { path: routes.home, element: <HomePage /> },
      { path: routes.listings, element: <ListingsPage /> },
      { path: routePatterns.listingDetail, element: <ListingDetailPage /> },
      { path: routes.saved, element: <SavedPage /> },
      { path: routes.signIn, element: <PlaceholderPage title="Prototype sign-in" /> },
      { path: routes.register, element: <PlaceholderPage title="Create a prototype account" /> },
      { path: routes.settings, element: <PlaceholderPage title="Settings" /> },
      { path: routes.offline, element: <PlaceholderPage title="You are offline" /> },
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
      { path: routes.tenant.overview, element: <PlaceholderPage title="Your rental at a glance" /> },
      { path: routes.tenant.rental, element: <PlaceholderPage title="My rental" /> },
      { path: routes.tenant.payments, element: <PlaceholderPage title="Payments" /> },
      { path: routePatterns.tenantPayDue, element: <PlaceholderPage title="Pay your due" /> },
      { path: routePatterns.tenantReceipt, element: <PlaceholderPage title="Payment receipt" /> },
      { path: routes.tenant.inquiries, element: <PlaceholderPage title="Inquiries" /> },
    ],
  },
];

export const createAppRouter = () => createBrowserRouter(appRoutes);
