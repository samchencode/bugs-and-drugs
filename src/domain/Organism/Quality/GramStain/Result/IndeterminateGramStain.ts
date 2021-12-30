import GramStainResult from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';

class IndeterminateGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Indeterminate';
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default IndeterminateGramStain;
