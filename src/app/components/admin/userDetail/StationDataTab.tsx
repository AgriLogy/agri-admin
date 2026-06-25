'use client';

import SensorChartPanel from './SensorChartPanel';

export type StationDataTabProps = { username: string };

/**
 * Admin read-only inline station/weather charts (agrilogy-front #47). Reads the
 * user's weather sensor time-series from the `/admin/sensor-data` explorer —
 * replaces the old link-out to the user-facing web app.
 */
export function StationDataTab({ username }: StationDataTabProps) {
  return <SensorChartPanel username={username} group="station" />;
}

export default StationDataTab;
