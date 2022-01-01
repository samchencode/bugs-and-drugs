export { default as default } from '@/domain/Antibiogram/SampleInfo/Source/Source';
import Urine from '@/domain/Antibiogram/SampleInfo/Source/Urine';
import NonUrine from '@/domain/Antibiogram/SampleInfo/Source/NonUrine';

const Sources = {
  get URINE() {
    return new Urine();
  },
  get NONURINE() {
    return new NonUrine();
  },
};

export { Sources };
