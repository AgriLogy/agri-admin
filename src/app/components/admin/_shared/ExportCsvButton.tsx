'use client';

import { Button } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useTranslations } from 'next-intl';
import { CSVLink } from 'react-csv';

export type CsvHeader = { label: string; key: string };

export type ExportCsvButtonProps<T> = {
  /** Rows to export — typically the currently filtered/selected table data. */
  data: T[];
  /** Column label → row key mapping (also fixes column order). */
  headers: CsvHeader[];
  /** File name without extension. */
  filename: string;
  label?: string;
  disabled?: boolean;
};

/**
 * "Export CSV" action for admin tables — a thin antd-styled wrapper around
 * react-csv's CSVLink. Exports whatever rows are passed in (e.g. the filtered
 * or selected set), so it always reflects what the user is looking at.
 */
export function ExportCsvButton<T extends Record<string, unknown>>({
  data,
  headers,
  filename,
  label,
  disabled,
}: ExportCsvButtonProps<T>) {
  const t = useTranslations();
  const isEmpty = disabled || data.length === 0;

  const button = (
    <Button icon={<DownloadOutlined />} disabled={isEmpty}>
      {label ?? t('admin.export.button')}
    </Button>
  );

  // When there's nothing to export, render the disabled button without the
  // anchor wrapper (an empty CSVLink would still trigger a blank download).
  if (isEmpty) return button;

  return (
    <CSVLink
      data={data as Record<string, unknown>[]}
      headers={headers}
      filename={`${filename}.csv`}
      style={{ textDecoration: 'none' }}
      aria-label={label ?? t('admin.export.button')}
    >
      {button}
    </CSVLink>
  );
}

export default ExportCsvButton;
