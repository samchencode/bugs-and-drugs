import Quality from '../Quality';
import type GramStainResult from './Result/GramStainResult';

class GramStain extends Quality {
  constructor(gramStainResult: GramStainResult) {
    super('gram-stain', gramStainResult);
  }

  toString(): string {
    return this.getValue().toString();
  }
}

export default GramStain;
