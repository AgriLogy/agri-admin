/**
 * The catalog of per-zone graph toggles (the ActiveGraph boolean flags).
 * Shared by the user-detail GraphsTab and the technician scope builder so the
 * available-graphs list stays in one place.
 */
export type GraphGroup = {
  id: string;
  emoji: string;
  titleKey: string;
  keys: string[];
};

export const GRAPH_GROUPS: GraphGroup[] = [
  {
    id: 'soil',
    emoji: '🌱',
    titleKey: 'admin.graphsTab.groupSoil',
    keys: [
      'soil_irrigation_status',
      'soil_ph_status',
      'soil_conductivity_status',
      'soil_moisture_status',
      'soil_temperature_status',
    ],
  },
  {
    id: 'weather',
    emoji: '☁️',
    titleKey: 'admin.graphsTab.groupWeather',
    keys: [
      'et0_status',
      'wind_speed_status',
      'wind_direction_status',
      'solar_radiation_status',
      'temperature_humidity_weather_status',
      'precipitation_humidity_rate_status',
      'pluviometry_status',
      'data_table_status',
      'wind_radar_status',
      'cumulative_precipitation_status',
      'precipitation_rate_status',
      'weather_temperature_humidity_status',
    ],
  },
  {
    id: 'water',
    emoji: '💧',
    titleKey: 'admin.graphsTab.groupWater',
    keys: [
      'water_flow_status',
      'water_pressure_status',
      'water_ph_status',
      'water_ec_status',
    ],
  },
  {
    id: 'plant',
    emoji: '🌿',
    titleKey: 'admin.graphsTab.groupPlant',
    keys: [
      'leaf_sensor_status',
      'fruit_size_status',
      'large_fruit_diameter_status',
    ],
  },
  {
    id: 'fertilizer',
    emoji: '🌾',
    titleKey: 'admin.graphsTab.groupFertilizer',
    keys: ['npk_status'],
  },
  {
    id: 'other',
    emoji: '⚡',
    titleKey: 'admin.graphsTab.groupOther',
    keys: ['electricity_consumption_status'],
  },
];

/** Flat list of every graph key, across all groups. */
export const GRAPH_KEYS: string[] = GRAPH_GROUPS.flatMap((g) => g.keys);
