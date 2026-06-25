'use client';

import SensorChartPanel from './SensorChartPanel';

export type SoilDataTabProps = { username: string };

/**
 * Admin read-only inline soil charts (agrilogy-front #47). Reads the user's
 * soil sensor time-series straight from the `/admin/sensor-data` explorer —
 * replaces the old link-out to the user-facing web app.
 */
export function SoilDataTab({ username }: SoilDataTabProps) {
  return <SensorChartPanel username={username} group="soil" />;
}

export default SoilDataTab;
