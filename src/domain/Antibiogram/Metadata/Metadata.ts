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
    const colOrder = params[ColumnOrder.slug];
    const rowOrder = params[RowOrder.slug];
    const footnotes = params[Footnotes.slug];
    const resistancerates = params[ResistanceRates.slug];

    if (colOrder != undefined) this.#columnOrder = colOrder;
    else this.#columnOrder = new NullMetadataValue();

    if (rowOrder != undefined) this.#rowOrder = rowOrder;
    else this.#rowOrder = new NullMetadataValue();

    if (resistancerates != undefined) this.#resistanceRates = resistancerates;
    else this.#resistanceRates = new NullMetadataValue();

    if (footnotes != undefined) this.#footnotes = footnotes;
    else this.#footnotes = new NullMetadataValue();
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
    if (this.#columnOrder != undefined)
      if (!this.#columnOrder.is(v.getColumnOrder())) return false;
    if (this.#rowOrder != undefined)
      if (!this.#rowOrder.is(v.getRowOrder())) return false;
    if (this.#resistanceRates != undefined)
      if (!this.#resistanceRates.is(v.getResistanceRates())) return false;
    if (this.#footnotes != undefined)
      if (!this.#footnotes.is(v.getFootnotes())) return false;

    return true;
  }
}

export default Metadata;
