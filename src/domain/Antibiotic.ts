import Entity from '@/domain/Entity';

class Antibiotic extends Entity {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    super();
    this.id = id;
    this.name = name;
  }
}

export default Antibiotic;
