import type SensitivityData from '@/domain/SensitivityData';

class Antibiogram {
  organisms = ['foo bar'];

  constructor(data: SensitivityData[]) {
    //
  }

  isEmpty() {
    return true;
  }
}

export default Antibiogram;
