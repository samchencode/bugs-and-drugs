import Entity from '@/domain/base/Entity';
import OrganismId from './OrganismId';
import type Quality from './Quality';

class Organism extends Entity {
  name?: string;
  qualities: Quality[];

  constructor(id: string, name?: string, qualities?: Quality[]) {
    super(new OrganismId(id));
    this.name = name;
    this.qualities = qualities ?? [];
  }

  hasQuality(quality: Quality): boolean {
    const match = this.qualities.find((q) => q.is(quality));
    return typeof match !== 'undefined';
  }
}

export default Organism;
