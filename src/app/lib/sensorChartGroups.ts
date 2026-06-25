/**
 * Pure helpers for the admin user-detail sensor charts (agrilogy-front #47):
 * split the `/admin/sensor-data` catalog slugs into the Soil and Station tab
 * groups, and shape newest-first reading rows into an ascending-time series
 * for recharts. Kept dependency-free so it's unit-testable under the repo's
 * babel-jest setup (component/render tests are deferred — next-intl/antd ESM).
 */
import type { SensorCatalogEntry, SensorReading } from './adminSensorDataApi';

export type SensorGroup = 'soil' | 'station';

/**
 * Which user-detail tab a sensor slug belongs to, or `null` if it fits
 * neither (water / plant / device sensors). Slugs come from the backend's
 * `_slug_for` = `ClassName.lower().replace('sensor','')`, e.g. `phsoil`,
 * `soilmoisturemedium`, `temperatureweather`, `et0calculated`.
 */
export function sensorGroupFor(slug: string): SensorGroup | null {
  const s = slug.toLowerCase();
  // Station / weather checked first so e.g. `vpdweather` / `et0weather` land
  // here rather than leaking into soil on a substring match.
  if (
    s.includes('weather') ||
    s.includes('wind') ||
    s === 'solarradiation' ||
    s.includes('precipitation') ||
    s.startsWith('et0')
  ) {
    return 'station';
  }
  if (
    s.includes('soil') ||
    s.includes('salinity') ||
    s === 'phsoil' ||
    s === 'npk'
  ) {
    return 'soil';
  }
  return null;
}

/** Catalog entries in a group, sorted by label. */
export function filterCatalogByGroup(
  catalog: SensorCatalogEntry[],
  group: SensorGroup
): SensorCatalogEntry[] {
  return catalog
    .filter((e) => sensorGroupFor(e.slug) === group)
    .sort((a, b) => a.label.localeCompare(b.label));
}

export type ChartPoint = { t: number; label: string; value: number };

/**
 * Rows arrive newest-first with possibly-null values; emit an ascending-time
 * series of finite points the chart can plot.
 */
export function toChartSeries(rows: SensorReading[]): ChartPoint[] {
  return rows
    .filter(
      (r) =>
        r.value != null &&
        r.timestamp != null &&
        Number.isFinite(r.value as number)
    )
    .map((r) => ({
      t: Date.parse(r.timestamp as string),
      label: r.timestamp as string,
      value: r.value as number,
    }))
    .filter((p) => Number.isFinite(p.t))
    .sort((a, b) => a.t - b.t);
}

/** ISO timestamp for `days` ago from `now` (default: now), for the `from` filter. */
export function isoDaysAgo(days: number, now: number = Date.now()): string {
  return new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
}
