import Antibiogram from '@/domain/Antibiogram/Antibiogram';
import AntibiogramId from '@/domain/Antibiogram/AntibiogramId';

class NullAntibiogram extends Antibiogram {
  constructor() {
    super(new AntibiogramId('NA'), []);
  }
}

export default NullAntibiogram;
