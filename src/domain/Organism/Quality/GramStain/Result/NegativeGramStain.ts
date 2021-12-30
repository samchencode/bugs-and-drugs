import GramStainResult from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';

class NegativeGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Negative';
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default NegativeGramStain;
