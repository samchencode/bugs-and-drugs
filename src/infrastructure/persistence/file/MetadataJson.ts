// enum MetadataFields {
//   'row-order' = 'row-order',
//   'column-order' = 'column-order',
//   'footnotes' = 'footnotes',
//   'resistance-rates' = 'resistance-rates',
// }

import {
  Footnotes,
  type ColumnOrder,
  type RowOrder,
} from '@/domain/Antibiogram';
import { ResistanceRates } from '@/domain/Antibiogram/Metadata';

// type MetadataJson = {
//   [key in MetadataFields]: string[];
// };

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
