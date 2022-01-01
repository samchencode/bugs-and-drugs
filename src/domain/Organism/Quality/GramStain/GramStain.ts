import Quality from '@/domain/Organism/Quality/Quality';
import type GramStainResult from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';

class GramStain extends Quality {
  readonly type = 'Gram Stain';

  constructor(gramStainResult: GramStainResult) {
    super(gramStainResult);
  }

  toString(): string {
    return this.getValue().toString();
  }
}

export default GramStain;
