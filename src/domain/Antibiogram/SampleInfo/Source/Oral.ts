import SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class Oral extends SourceValue {
  toString() {
    return 'Oral';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default Oral;
