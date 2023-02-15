import Setting from '@/domain/Antibiogram/SampleInfo/Setting/Setting';
import InPatient from '@/domain/Antibiogram/SampleInfo/Setting/InPatient';
import OutPatient from '@/domain/Antibiogram/SampleInfo/Setting/OutPatient';
import LongTermCare from '@/domain/Antibiogram/SampleInfo/Setting/longTermCare';

const Settings = {
  get INPATIENT() {
    return new Setting(new InPatient());
  },
  get OUTPATIENT() {
    return new Setting(new OutPatient());
  },
  get LTC() {
    return new Setting(new LongTermCare());
  },
};

export { Setting, Settings };
