export type { default as GramStainResult } from '@/domain/Organism/Quality/GramStain/Result/GramStainResult';
import IndeterminateGramStain from '@/domain/Organism/Quality/GramStain/Result/IndeterminateGramStain';
import NegativeGramStain from '@/domain/Organism/Quality/GramStain/Result/NegativeGramStain';
import PositiveGramStain from '@/domain/Organism/Quality/GramStain/Result/PositiveGramStain';

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
