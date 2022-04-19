import SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class Meningitis extends SourceValue {
  toString() {
    return 'Meningitis';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default Meningitis;
