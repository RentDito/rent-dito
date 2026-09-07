import type { ReactNode } from 'react';

import { EmptyState } from '@/shared/ui/Feedback/Feedback';

import styles from './DataTable.module.css';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Label shown before the value in the narrow stacked layout. */
  mobileLabel?: string;
  align?: 'start' | 'end';
}

export interface DataTableProps<T> {
  /** Describes the table for assistive technology and becomes its name. */
  caption: string;
  columns: Array<DataTableColumn<T>>;
  rows: T[];
  rowKey: (row: T) => string;
  emptyMessage?: string;
  emptyAction?: ReactNode;
}

/**
 * One semantic table that reflows into labelled stacked records below 768px,
 * so the same markup serves desktop and mobile without duplicate contracts.
 */
export const DataTable = <T,>({
  caption,
  columns,
  rows,
  rowKey,
  emptyMessage,
  emptyAction,
}: DataTableProps<T>) => {
  if (rows.length === 0) {
    return <EmptyState title={emptyMessage ?? 'Nothing to show yet.'} action={emptyAction} />;
  }

  return (
    <div className={styles.scroll}>
      <table className={styles.table}>
        <caption className={styles.caption}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.align ?? 'start'}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  key={column.key}
                  data-label={column.mobileLabel ?? column.header}
                  data-align={column.align ?? 'start'}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
