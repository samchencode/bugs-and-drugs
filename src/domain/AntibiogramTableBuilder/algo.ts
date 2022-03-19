import type Antibiogram from '@/domain/Antibiogram';
import RowInfoAssembler from '@/domain/AntibiogramTableBuilder/RowInfoAssembler';
import ColumnInfoAssembler from '@/domain/AntibiogramTableBuilder/ColumnInfoAssembler';

function algo1(abg: Antibiogram) {
  const assembler = new RowInfoAssembler(
    abg.getSensitivities(),
    abg.organisms,
    abg.antibiotics
  );
  return assembler.assembleRows();
}

function algo2(abg: Antibiogram) {
  const ass = new ColumnInfoAssembler(
    abg.getSensitivities(),
    abg.antibiotics,
    abg.info
  );
  return ass.assembleColumns();
}

export default algo1;

export { algo2 };
