import Entity from '@/domain/base/Entity';
import EntityId from '@/domain/base/EntityId';

class Organism extends Entity {
  name: string;

  constructor(id: string, name: string) {
    super(new OrganismId(id));
    this.name = name;
  }
}

class OrganismId extends EntityId {
  constructor(id: string) {
    super(id);
  }
}

export default Organism;
