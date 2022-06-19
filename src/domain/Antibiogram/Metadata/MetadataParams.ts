import type ColumnOrder from '@/domain/Antibiogram/Metadata/ColumnOrder';
import type Footnotes from '@/domain/Antibiogram/Metadata/Footnotes';
import type ResistanceRates from '@/domain/Antibiogram/Metadata/ResistanceRates';
import type RowOrder from '@/domain/Antibiogram/Metadata/RowOrder';

interface MetadataParams {
  [RowOrder.slug]?: RowOrder;
  [ColumnOrder.slug]?: ColumnOrder;
  [Footnotes.slug]?: Footnotes;
  [ResistanceRates.slug]?: ResistanceRates;
}

export default MetadataParams;
