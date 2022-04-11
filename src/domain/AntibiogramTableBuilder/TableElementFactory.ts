import {
  FilledCell,
  Label,
  Tooltip,
  EmptyCell,
  type LabelParams,
} from '@/domain/Table';
import type RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';
import type CellInfo from '@/domain/AntibiogramTableBuilder/CellInfo';
import type ColumnInfo from '@/domain/AntibiogramTableBuilder/ColumnInfo';

class TableElementFactory {
  makeCell(c: CellInfo) {
    const data = c.data;
    const value = data.map((d) => d.getValue().toString()).join('\n');
    // TODO: handle multiple data vs one data w/ ?tooltip
    return new FilledCell(value);
  }

  makeLabel(text: string, tooltipText?: string) {
    const params: Partial<LabelParams> = {};
    if (tooltipText) params.tooltip = new Tooltip(tooltipText);
    return new Label(text, params);
  }

  makeRowLabel(r: RowInfo) {
    const tooltips = r.info
      .itemsToArray()
      .map((si) => new Tooltip(si.toString()));
    const tooltip = new Tooltip(tooltips);
    const labelText = `${r.organism.getName()} (${r.isolates})`;
    return this.makeLabel(labelText, tooltip.toString());
  }

  makeColumnLabel(c: ColumnInfo) {
    const route = c.antibiotic
      .getAntibiotics()
      .map((abx) => abx.getRoute().toString())
      .join(', ');

    const si = c.info.itemsToArray();
    const tooltip = new Tooltip(
      [...si, route].map((si) => new Tooltip(si.toString()))
    );
    return this.makeLabel(c.antibiotic.getName(), tooltip.toString());
  }

  makeEmptyMatrix(nRow: number, nCol: number): EmptyCell[][] {
    return new Array(nRow).fill(undefined).map(() => this.makeEmptyRow(nCol));
  }

  makeEmptyRow(size: number): EmptyCell[] {
    return new Array(size).fill(undefined).map(() => new EmptyCell());
  }
}

export default TableElementFactory;
