import { InlineAlert } from '@/shared/ui/Feedback/Feedback';

export interface PlaceholderPageProps {
  title: string;
}

/**
 * Temporary route target. The route tree is registered up front so navigation
 * and the shells are complete; each entry is replaced by its real page module
 * as that page is implemented.
 */
export const PlaceholderPage = ({ title }: PlaceholderPageProps) => (
  <>
    <h1>{title}</h1>
    <InlineAlert tone="info" title="This page is not built yet">
      The navigation and shell are in place. {title} arrives with its own task.
    </InlineAlert>
  </>
);
