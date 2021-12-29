import Entity from '@/domain/base/Entity';
import EntityId from '@/domain/base/EntityId';

class Antibiotic extends Entity {
  name: string;

  constructor(id: string, name: string) {
    super(new AntibioticId(id));
    this.name = name;
  }
}

class AntibioticId extends EntityId {
  constructor(id: string) {
    super(id);
  }
}

export default Antibiotic;
