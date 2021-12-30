import Quality from '@/domain/Organism/Quality/Quality';
import type GramStainResult from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';

class GramStain extends Quality {
  constructor(gramStainResult: GramStainResult) {
    super('gram-stain', gramStainResult);
  }

  toString(): string {
    return this.getValue().toString();
  }
}

export default GramStain;
