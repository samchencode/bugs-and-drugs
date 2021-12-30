import Organism from './Organism';
import OrganismId from './OrganismId';

class NullOrganism extends Organism {
  constructor() {
    super(new OrganismId('NA'), 'unknown');
  }
}

export default NullOrganism;
