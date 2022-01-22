export type { default as GramValue } from '@/domain/Antibiogram/GramValue/GramValue';

import GramPositive from '@/domain/Antibiogram/GramValue/GramPositive';
import GramNegative from '@/domain/Antibiogram/GramValue/GramNegative';
import Unspecified from '@/domain/Antibiogram/GramValue/Unspecified';

const GramValues = {
  get POSITIVE() {
    return new GramPositive();
  },
  get NEGATIVE() {
    return new GramNegative();
  },
  get UNSPECIFIED() {
    return new Unspecified();
  },
};

export { GramValues };
