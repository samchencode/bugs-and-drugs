import SourceValue from '@/domain/Antibiogram/SampleInfo/Source/SourceValue';

class NonMeningitis extends SourceValue {
  toString() {
    return 'Non-Meningitis';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default NonMeningitis;
