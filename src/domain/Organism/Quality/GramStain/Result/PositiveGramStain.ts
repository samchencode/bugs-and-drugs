import GramStainResult from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';

class PositiveGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Positive';
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default PositiveGramStain;
