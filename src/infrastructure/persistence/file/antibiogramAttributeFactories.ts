import {
  AntibiogramId,
  ColumnOrder,
  Footnotes,
  GramValues,
  IntegerNumberOfIsolates,
  Interval,
  Metadata,
  OrganismValue,
  Place,
  Routes,
  RowOrder,
  SampleInfo,
  SensitivityValue,
  Settings,
  SingleAntibioticValue,
  Sources,
  type Route,
} from '@/domain/Antibiogram';
import { ResistanceRates } from '@/domain/Antibiogram/Metadata';
import type MetadataParams from '@/domain/Antibiogram/Metadata/MetadataParams';
import ResistanceRate from '@/domain/Antibiogram/Metadata/ResistanceRate';
import type { MetadataJson } from '@/infrastructure/persistence/file/MetadataJson';

// IDEA: make this into an abstract factory specific to the shape of the data csv
// IDEA: or atlas csv in case I change csv shape / columns later

export const org = (name: string) => new OrganismValue(name);

export const abx = (name: string, route?: Route) =>
  new SingleAntibioticValue(name, route);

export const value = (value: string) => new SensitivityValue(value);

export const route = (name: string) => {
  if (name === 'PO') return Routes.PO;
  if (name === 'IV') return Routes.IV;
  if (name === 'IV/PO') return Routes.IV_PO;
  throw new Error('Unknown Route');
};

export const iso = (value: string) => {
  return new IntegerNumberOfIsolates(+value);
};

export const infoItem = (value: string) => {
  if (value === 'inpatient') return Settings.INPATIENT;
  if (value === 'outpatient') return Settings.OUTPATIENT;
  if (value === 'urine') return Sources.URINE;
  if (value === 'non-urine') return Sources.NONURINE;
  if (value === 'meningitis') return Sources.MENINGITIS;
  if (value === 'non-meningitis') return Sources.NONMENINGITIS;
  if (value === 'oral') return Sources.ORAL;
  throw new Error('Unknown Sample Info Item' + value);
};

export const info = (listStr: string) => {
  const list = listStr.split(/, ?/g).map((l) => infoItem(l));
  return new SampleInfo(list);
};

export const gram = (value: string) => {
  if (value === 'positive') return GramValues.POSITIVE;
  if (value === 'negative') return GramValues.NEGATIVE;
  if (value === 'unspecified') return GramValues.UNSPECIFIED;
  throw new Error('Unknown Gram Value ' + value);
};

export const place = (region: string, institution: string) =>
  new Place(region, institution);

export const interval = (start: string, stop: string) => {
  const startYear = +start.slice(0, 4);
  const startMonth = +start.slice(4, 6);
  const endYear = +stop.slice(0, 4);
  const endMonth = +stop.slice(4, 6);

  return new Interval(
    new Date(+startYear, +startMonth - 1),
    new Date(+endYear, +endMonth - 1)
  );
};

export const id = (id: string) => new AntibiogramId(id);

export const metadata = (metadata: MetadataJson) => {
  const metadataParams: MetadataParams = {};

  if (metadata[RowOrder.slug])
    metadataParams[RowOrder.slug] = new RowOrder(metadata[RowOrder.slug]);
  if (metadata[ColumnOrder.slug])
    metadataParams[ColumnOrder.slug] = new ColumnOrder(
      metadata[ColumnOrder.slug]
    );
  if (metadata[ResistanceRates.slug])
    metadataParams[ResistanceRates.slug] = new ResistanceRates(
      metadata[ResistanceRates.slug].map((r) => {
        return new ResistanceRate(r.label, r.year, r.value);
      })
    );
  if (metadata[Footnotes.slug])
    metadataParams[Footnotes.slug] = new Footnotes(metadata[Footnotes.slug]);

  return new Metadata(metadataParams);
};
