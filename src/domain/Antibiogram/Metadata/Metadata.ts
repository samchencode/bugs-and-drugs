import ColumnOrder from '@/domain/Antibiogram/Metadata/ColumnOrder';
import Footnotes from '@/domain/Antibiogram/Metadata/Footnotes';
import type MetadataParams from '@/domain/Antibiogram/Metadata/MetadataParams';
import NullMetadataValue from '@/domain/Antibiogram/Metadata/NullMetaDataValue';
import ResistanceRates from '@/domain/Antibiogram/Metadata/ResistanceRates';
import RowOrder from '@/domain/Antibiogram/Metadata/RowOrder';
import ValueObject from '@/domain/base/ValueObject';

class Metadata extends ValueObject {
  #columnOrder: ColumnOrder | NullMetadataValue;
  #rowOrder: RowOrder | NullMetadataValue;
  #resistanceRates: ResistanceRates | NullMetadataValue;
  #footnotes: Footnotes | NullMetadataValue;

  constructor(params: MetadataParams) {
    super();
    this.#columnOrder = params[ColumnOrder.slug] ?? new NullMetadataValue();
    this.#rowOrder = params[RowOrder.slug] ?? new NullMetadataValue();
    this.#resistanceRates =
      params[ResistanceRates.slug] ?? new NullMetadataValue();
    this.#footnotes = params[Footnotes.slug] ?? new NullMetadataValue();
  }
  getColumnOrder() {
    return this.#columnOrder;
  }
  getRowOrder() {
    return this.#rowOrder;
  }
  getResistanceRates() {
    return this.#resistanceRates;
  }
  getArrayOfResistanceRates() {
    return this.#resistanceRates.getResistanceRates();
  }
  getFootnotes() {
    return this.#footnotes;
  }

  protected isIdentical(v: Metadata): boolean {
    if (!this.#columnOrder.is(v.getColumnOrder())) return false;
    if (!this.#rowOrder.is(v.getRowOrder())) return false;
    if (!this.#resistanceRates.is(v.getResistanceRates())) return false;
    if (!this.#footnotes.is(v.getFootnotes())) return false;

    return true;
  }
}

export default Metadata;
