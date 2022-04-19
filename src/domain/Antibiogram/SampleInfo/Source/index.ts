import Source from '@/domain/Antibiogram/SampleInfo/Source/Source';
import Urine from '@/domain/Antibiogram/SampleInfo/Source/Urine';
import NonUrine from '@/domain/Antibiogram/SampleInfo/Source/NonUrine';
import NonMeningitis from '@/domain/Antibiogram/SampleInfo/Source/NonMeningitis';
import Meningitis from '@/domain/Antibiogram/SampleInfo/Source/Meningitis';
import Oral from '@/domain/Antibiogram/SampleInfo/Source/Oral';

const Sources = {
  get URINE() {
    return new Source(new Urine());
  },
  get NONURINE() {
    return new Source(new NonUrine());
  },
  get MENINGITIS() {
    return new Source(new Meningitis());
  },
  get NONMENINGITIS() {
    return new Source(new NonMeningitis());
  },
  get ORAL() {
    return new Source(new Oral());
  },
};

export { Source, Sources };
