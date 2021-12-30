import Organism from '@/domain/Organism/Organism';
import OrganismId from '@/domain/Organism/OrganismId';

class NullOrganism extends Organism {
  constructor() {
    super(new OrganismId('NA'), 'unknown');
  }
}

export default NullOrganism;
