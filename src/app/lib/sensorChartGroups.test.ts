import {
  filterCatalogByGroup,
  isoDaysAgo,
  rangeCovering,
  sensorGroupFor,
  toChartSeries,
} from './sensorChartGroups';

describe('sensorGroupFor', () => {
  it('classifies soil sensors', () => {
    for (const slug of [
      'soilmoisturemedium',
      'soilmoisturehigh',
      'soiltemperaturelow',
      'phsoil',
      'ecsoilmedium',
      'soilconductivity',
      'multidepthsoilmoisture',
      'soilsalinity',
      'ecsalinity',
      'npk',
    ]) {
      expect(sensorGroupFor(slug)).toBe('soil');
    }
  });

  it('classifies station / weather sensors', () => {
    for (const slug of [
      'temperatureweather',
      'humidityweather',
      'pressureweather',
      'vpdweather',
      'windspeed',
      'winddirection',
      'solarradiation',
      'precipitationrate',
      'et0weather',
      'et0calculated',
    ]) {
      expect(sensorGroupFor(slug)).toBe('station');
    }
  });

  it('returns null for water / plant / device sensors', () => {
    for (const slug of [
      'waterflow',
      'waterec',
      'waterlevel',
      'waterpressure',
      'phwater',
      'leafmoisture',
      'leaftemperature',
      'largefruitdiameter',
      'fruitsize',
      'electricityconsumption',
      'battery',
      'signal',
    ]) {
      expect(sensorGroupFor(slug)).toBeNull();
    }
  });

  it('is case-insensitive', () => {
    expect(sensorGroupFor('PhSoil')).toBe('soil');
    expect(sensorGroupFor('TemperatureWeather')).toBe('station');
  });
});

describe('filterCatalogByGroup', () => {
  const catalog = [
    { slug: 'temperatureweather', label: 'Weather Temp' },
    { slug: 'phsoil', label: 'Soil pH' },
    { slug: 'soilmoisturemedium', label: 'Soil Moisture' },
    { slug: 'waterflow', label: 'Water Flow' },
  ];

  it('keeps only the group and sorts by label', () => {
    expect(filterCatalogByGroup(catalog, 'soil').map((e) => e.slug)).toEqual([
      'soilmoisturemedium',
      'phsoil',
    ]);
    expect(filterCatalogByGroup(catalog, 'station').map((e) => e.slug)).toEqual(
      ['temperatureweather']
    );
  });
});

describe('toChartSeries', () => {
  const row = (id: number, value: number | null, timestamp: string | null) => ({
    id,
    value,
    timestamp,
    zone_id: 1,
    username: 'u',
  });

  it('drops nulls/invalid and sorts ascending by time', () => {
    const series = toChartSeries([
      row(1, 20, '2026-06-02T10:00:00Z'),
      row(2, null, '2026-06-01T10:00:00Z'),
      row(3, 15, '2026-06-01T10:00:00Z'),
      row(4, 99, null),
    ]);
    expect(series.map((p) => p.value)).toEqual([15, 20]);
    expect(series[0].t).toBeLessThan(series[1].t);
  });

  it('returns an empty series when nothing is plottable', () => {
    expect(toChartSeries([row(1, null, null)])).toEqual([]);
  });
});

describe('isoDaysAgo', () => {
  it('subtracts whole days from the given now', () => {
    const now = Date.parse('2026-06-10T00:00:00Z');
    expect(isoDaysAgo(7, now)).toBe('2026-06-03T00:00:00.000Z');
  });
});

describe('rangeCovering', () => {
  const now = Date.parse('2026-06-10T12:00:00Z');
  const ranges = [1, 7, 30, 90] as const;

  it('picks the smallest period that reaches the last reading', () => {
    expect(rangeCovering('2026-06-10T00:00:00Z', ranges, now)).toBe(1);
    expect(rangeCovering('2026-06-05T12:00:00Z', ranges, now)).toBe(7);
    expect(rangeCovering('2026-05-20T12:00:00Z', ranges, now)).toBe(30);
    expect(rangeCovering('2026-04-01T12:00:00Z', ranges, now)).toBe(90);
  });

  it('includes a reading exactly at the edge of a period', () => {
    expect(rangeCovering('2026-06-03T12:00:00Z', ranges, now)).toBe(7);
  });

  it('returns null when the reading is older than every period', () => {
    expect(rangeCovering('2026-01-01T00:00:00Z', ranges, now)).toBeNull();
  });

  it('returns null for missing or unparseable timestamps', () => {
    expect(rangeCovering(null, ranges, now)).toBeNull();
    expect(rangeCovering(undefined, ranges, now)).toBeNull();
    expect(rangeCovering('not-a-date', ranges, now)).toBeNull();
  });
});
