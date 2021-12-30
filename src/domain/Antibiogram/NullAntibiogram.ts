import Antibiogram from './Antibiogram';
import AntibiogramId from './AntibiogramId';

class NullAntibiogram extends Antibiogram {
  constructor() {
    super(new AntibiogramId('NA'), []);
  }
}

export default NullAntibiogram;
