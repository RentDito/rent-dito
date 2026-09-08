import { X } from 'lucide-react';
import { useState, type FormEvent } from 'react';

import { Button } from '@/shared/ui/Button/Button';
import { Field } from '@/shared/ui/Field/Field';

import styles from './ListingFilters.module.css';
import { CITIES, PROPERTY_TYPES, type AppliedFilter } from './useListingSearch';

export interface ListingFiltersProps {
  /** Current values, read from the URL by `useListingSearch`. */
  values: {
    q: string;
    city: string;
    type: string;
    minRent: string;
    maxRent: string;
  };
  appliedFilters: AppliedFilter[];
  onApply: (next: ListingFiltersProps['values']) => void;
  onRemove: (key: AppliedFilter['key']) => void;
  onClear: () => void;
  /** Hide when the host surface (dialog/drawer) already supplies a title. */
  hideHeading?: boolean;
  onApplied?: () => void;
}

/**
 * One filter form used in the filters dialog and drawer, so filter meaning
 * and state never diverge between layouts.
 */
export const ListingFilters = ({
  values,
  appliedFilters,
  onApply,
  onRemove,
  onClear,
  hideHeading = false,
  onApplied,
}: ListingFiltersProps) => {
  const [draft, setDraft] = useState(values);
  const [syncedFrom, setSyncedFrom] = useState(values);

  // The URL is the source of truth, so re-sync when it changes — but only then,
  // otherwise an unrelated re-render would discard what the user is typing.
  if (values !== syncedFrom) {
    setSyncedFrom(values);
    setDraft(values);
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onApply(draft);
    onApplied?.();
  };

  const update = (key: keyof ListingFiltersProps['values']) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form className={styles.filters} onSubmit={submit} aria-label="Listing filters">
      {!hideHeading ? <h2 className={styles.heading}>Filters</h2> : null}

      {appliedFilters.length > 0 ? (
        <ul className={styles.chips} aria-label="Applied filters">
          {appliedFilters.map((filter) => (
            <li key={filter.key}>
              <button
                type="button"
                className={styles.chip}
                onClick={() => onRemove(filter.key)}
                aria-label={`Remove filter ${filter.label}`}
              >
                {filter.label}
                <X className={styles.chipIcon} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <Field label="Search by name or area">
        <input
          type="search"
          value={draft.q}
          onChange={(event) => update('q')(event.target.value)}
          placeholder="Makati, Lahug, Maple Court"
        />
      </Field>

      <Field label="City">
        <select value={draft.city} onChange={(event) => update('city')(event.target.value)}>
          <option value="">Any city</option>
          {CITIES.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Property type">
        <select value={draft.type} onChange={(event) => update('type')(event.target.value)}>
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </Field>

      <div className={styles.rentRow}>
        <Field label="Minimum rent" hint="Pesos per month">
          <input
            type="number"
            min={0}
            step={500}
            value={draft.minRent}
            onChange={(event) => update('minRent')(event.target.value)}
          />
        </Field>
        <Field label="Maximum rent" hint="Pesos per month">
          <input
            type="number"
            min={0}
            step={500}
            value={draft.maxRent}
            onChange={(event) => update('maxRent')(event.target.value)}
          />
        </Field>
      </div>

      <div className={styles.actions}>
        <Button type="submit" block>
          Apply filters
        </Button>
        <Button type="button" variant="ghost" block onClick={onClear}>
          Clear all filters
        </Button>
      </div>
    </form>
  );
};
