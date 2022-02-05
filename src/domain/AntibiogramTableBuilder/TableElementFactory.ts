import type { AntibioticValue, SensitivityData } from '@/domain/Antibiogram';
import {
  FilledCell,
  Label,
  Tooltip,
  EmptyCell,
  type LabelParams,
} from '@/domain/Table';
import type RowInfo from '@/domain/AntibiogramTableBuilder/RowInfo';

class TableElementFactory {
  makeCell(data: SensitivityData) {
    const value = data.getValue().toString();
    return new FilledCell(value);
  }

  makeLabel(text: string, tooltipText?: string) {
    const params: Partial<LabelParams> = {};
    if (tooltipText) params.tooltip = new Tooltip(tooltipText);
    return new Label(text, params);
  }

  makeOrganismLabel(r: RowInfo) {
    const tooltip = r.info.toString() + '\n' + r.iso.toString() + ' Isolates';
    return this.makeLabel(r.org.getName(), tooltip);
  }

  makeAntibioticLabel(a: AntibioticValue) {
    return this.makeLabel(
      a.getName(),
      a
        .getAntibiotics()
        .map((abx) => abx.getRoute().toString())
        .join(', ')
    );
  }

  makeEmptyMatrix(nRow: number, nCol: number): EmptyCell[][] {
    return new Array(nRow).fill(undefined).map(() => this.makeEmptyRow(nCol));
  }

  makeEmptyRow(size: number): EmptyCell[] {
    return new Array(size).fill(undefined).map(() => new EmptyCell());
  }
}

export default TableElementFactory;
