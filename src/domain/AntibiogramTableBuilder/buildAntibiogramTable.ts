import type Antibiogram from '@/domain/Antibiogram';
import AntibiogramTableBuilder from '@/domain/AntibiogramTableBuilder/AntibiogramTableBuilder';

function buildAntibiogramTable(abg: Antibiogram) {
  const builder = new AntibiogramTableBuilder();
  builder.makeLabels(abg);
  builder.makeMatrix(abg);
  builder.makeRowGroups(abg);
  return builder.build();
}

export default buildAntibiogramTable;
