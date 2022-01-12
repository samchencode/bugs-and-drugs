import type {
  AntibioticValue,
  OrganismValue,
  SensitivityData,
} from '@/domain/Antibiogram';
import {
  FilledCell,
  Label,
  Tooltip,
  EmptyCell,
  type LabelParams,
} from '@/domain/Table';

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
