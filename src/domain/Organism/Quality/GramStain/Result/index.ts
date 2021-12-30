export type { default as GramStainResult } from './GramStainResult';
import IndeterminateGramStain from './IndeterminateGramStain';
import NegativeGramStain from './NegativeGramStain';
import PositiveGramStain from './PositiveGramStain';

const resultValueFactory = {
  get POSITIVE() {
    return new PositiveGramStain();
  },
  get NEGATIVE() {
    return new NegativeGramStain();
  },
  get INDETERMINATE() {
    return new IndeterminateGramStain();
  },
};

export default resultValueFactory;
