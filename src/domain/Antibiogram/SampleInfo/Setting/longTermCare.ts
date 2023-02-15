import SettingValue from '@/domain/Antibiogram/SampleInfo/Setting/SettingValue';

class LongTermCare extends SettingValue {
  toString(): string {
    return 'Long Term Care';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default LongTermCare;
