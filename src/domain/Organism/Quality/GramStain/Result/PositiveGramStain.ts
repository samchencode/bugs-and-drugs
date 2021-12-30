import GramStainResult from './GramStainResult';

class PositiveGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Positive';
  }
  protected isIdentical(v: PositiveGramStain): boolean {
    return true;
  }
}

export default PositiveGramStain;
