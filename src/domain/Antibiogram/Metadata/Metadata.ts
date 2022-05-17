import ColumnOrder from '@/domain/Antibiogram/Metadata/ColumnOrder';
import Footnotes from '@/domain/Antibiogram/Metadata/Footnotes';
import type MetadataParams from '@/domain/Antibiogram/Metadata/MetadataParams';
import ResistanceRates from '@/domain/Antibiogram/Metadata/ResistanceRates';
import RowOrder from '@/domain/Antibiogram/Metadata/RowOrder';
import ValueObject from '@/domain/base/ValueObject';

class Metadata extends ValueObject {
  #columnOrder?: ColumnOrder;
  #rowOrder?: RowOrder;
  #resistanceRates?: ResistanceRates;
  #footnotes?: Footnotes;

  constructor(params: MetadataParams) {
    super();
    this.#columnOrder = params[ColumnOrder.slug];
    this.#rowOrder = params[RowOrder.slug];
    this.#resistanceRates = params[ResistanceRates.slug];
    this.#footnotes = params[Footnotes.slug];
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
    return this.#resistanceRates?.getResistanceRates();
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

    if (
      v.getColumnOrder() == undefined &&
      v.getRowOrder() == undefined &&
      v.getResistanceRates() == undefined &&
      v.getFootnotes() == undefined
    )
      return true;

    return false;
  }
}

export default Metadata;
