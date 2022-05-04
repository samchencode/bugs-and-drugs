import {
  FilledCell,
  Label,
  Tooltip,
  EmptyCell,
  type LabelParams,
  type AlertLevel,
  AlertLevels,
} from '@/domain/Table';
import type RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';
import type CellInfo from '@/domain/AntibiogramTableBuilder/CellInfo';
import type ColumnInfo from '@/domain/AntibiogramTableBuilder/ColumnInfo';
import { Routes } from '@/domain/Antibiogram';
import { IntegerNumberOfIsolates } from '@/domain/Antibiogram/NumberOfIsolates';

class TableElementFactory {
  makeCell(c: CellInfo) {
    const data = c.data;
    const value = data.map((d) => d.getValue().toString()).join('\n');
    // TODO: handle multiple data vs one data w/ ?tooltip
    return new FilledCell(value);
  }

  makeLabel(text: string, tooltip?: Tooltip, alert?: AlertLevel) {
    const params: Partial<LabelParams> = {};
    if (tooltip) params.tooltip = tooltip;
    if (alert) params.alert = alert;

    return new Label(text, params);
  }

  makeRowLabel(r: RowInfo) {
    const isolates = r.data[0].getIsolates();
    let hasEnoughIsolates = false;
    let alert = AlertLevels.NONE;
    if (isolates instanceof IntegerNumberOfIsolates) {
      hasEnoughIsolates = isolates.isEnough();
    }

    const tooltips = r.info
      .itemsToArray()
      .map((si) => new Tooltip(si.toString()));
    tooltips.push(new Tooltip(`${r.isolates} Isolates`));
    if (!hasEnoughIsolates) {
      tooltips.push(new Tooltip('\u26a0 low or unknown number of isolates'));
      alert = AlertLevels.WARN;
    }
    const labelText = `${r.organism.getName()}`;
    return this.makeLabel(labelText, new Tooltip(tooltips), alert);
  }

  makeColumnLabel(c: ColumnInfo) {
    const route = c.antibiotic
      .getAntibiotics()
      .filter((abx) => !abx.getRoute().is(Routes.UNKNOWN))
      .map((abx) => abx.getRoute().toString())
      .join(', ');

    const si = c.info.itemsToArray();
    const tooltips = [si, route]
      .map((s) => '' + s)
      .filter((s) => s !== '')
      .map((s) => new Tooltip(s));
    return this.makeLabel(c.antibiotic.getName(), new Tooltip(tooltips));
  }

  makeEmptyMatrix(nRow: number, nCol: number): EmptyCell[][] {
    return new Array(nRow).fill(undefined).map(() => this.makeEmptyRow(nCol));
  }

  makeEmptyRow(size: number): EmptyCell[] {
    return new Array(size).fill(undefined).map(() => new EmptyCell());
  }
}

export default TableElementFactory;
