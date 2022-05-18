import {
  Footnotes,
  type ColumnOrder,
  type RowOrder,
} from '@/domain/Antibiogram';
import { ResistanceRates } from '@/domain/Antibiogram/Metadata';

type ResistanceRate = {
  label: string;
  value: number;
  year: number;
};

type MetadataJson = {
  [RowOrder.slug]: string[];
  [ColumnOrder.slug]: string[];
  [Footnotes.slug]: string[];
  [ResistanceRates.slug]: ResistanceRate[];
};
export type { MetadataJson };
