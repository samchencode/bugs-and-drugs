import GramStainResult from './GramStainResult';

class IndeterminateGramStain extends GramStainResult {
  toString(): string {
    return 'Gram Indeterminate';
  }
  protected isIdentical(v: IndeterminateGramStain): boolean {
    return true;
  }
}

export default IndeterminateGramStain;
