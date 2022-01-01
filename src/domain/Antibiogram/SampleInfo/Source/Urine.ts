import SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class Urine extends SourceValue {
  toString() {
    return 'Urine';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default Urine;
