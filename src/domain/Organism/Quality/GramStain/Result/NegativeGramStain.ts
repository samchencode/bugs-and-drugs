import GramStainResult from './GramStainResult';

class NegativeGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Negative';
  }
  protected isIdentical(v: NegativeGramStain): boolean {
    return true;
  }
}

export default NegativeGramStain;
