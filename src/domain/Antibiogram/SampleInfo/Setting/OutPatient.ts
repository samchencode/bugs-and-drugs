import SettingValue from '@/domain/Antibiogram/SampleInfo/Setting/SettingValue';

class OutPatient extends SettingValue {
  toString(): string {
    return 'Outpatient Setting';
  }
  protected isIdentical(): boolean {
    return true;
  }
}

export default OutPatient;
