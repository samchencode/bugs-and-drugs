export { default as default } from '@/domain/Antibiogram/SampleInfo/Setting/Setting';
import InPatient from '@/domain/Antibiogram/SampleInfo/Setting/InPatient';
import OutPatient from '@/domain/Antibiogram/SampleInfo/Setting/OutPatient';

const Settings = {
  get INPATIENT() {
    return new InPatient();
  },
  get OUTPATIENT() {
    return new OutPatient();
  },
};

export { Settings };
