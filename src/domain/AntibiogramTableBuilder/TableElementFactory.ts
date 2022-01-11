import type {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
} from '@/domain/Antibiogram';
import { FilledCell, Label, Tooltip, EmptyCell } from '@/domain/Table';

class TableElementFactory {
  makeCell(data: SensitivityData) {
    const value = data.getValue().toString();
    return new FilledCell(value);
  }

  makeLabel(text: string, tooltipText?: string) {
    return new Label(text, {
      tooltip: tooltipText ? new Tooltip(tooltipText) : undefined,
    });
  }

  makeOrganismLabel(o: OrganismValue) {
    return this.makeLabel(o.getName());
  }

  makeAntibioticLabel(a: AntibioticValue) {
    return this.makeLabel(a.getName());
  }

  makeEmptyMatrix(nRow: number, nCol: number): EmptyCell[][] {
    return new Array(nRow).fill(undefined).map(() => this.makeEmptyRow(nCol));
  }

  makeEmptyRow(size: number): EmptyCell[] {
    return new Array(size).fill(undefined).map(() => new EmptyCell());
  }
}

export default TableElementFactory;
