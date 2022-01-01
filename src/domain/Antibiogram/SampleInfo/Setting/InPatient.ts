import SettingValue from '@/domain/Antibiogram/SampleInfo/Setting/SettingValue';

class InPatient extends SettingValue {
  toString(): string {
    return 'Inpatient Setting';
  }

  protected isIdentical(): boolean {
    return true;
  }
}

export default InPatient;
