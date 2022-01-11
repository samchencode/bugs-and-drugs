import Source from '@/domain/Antibiogram/SampleInfo/Source/Source';
import Urine from '@/domain/Antibiogram/SampleInfo/Source/Urine';
import NonUrine from '@/domain/Antibiogram/SampleInfo/Source/NonUrine';

const Sources = {
  get URINE() {
    return new Source(new Urine());
  },
  get NONURINE() {
    return new Source(new NonUrine());
  },
};

export { Source, Sources };
