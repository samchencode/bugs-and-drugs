import Entity from '@/domain/base/Entity';
import type OrganismId from './OrganismId';
import type Quality from './Quality';

class Organism extends Entity {
  name?: string;
  qualities: Quality[];

  constructor(id: OrganismId, name?: string, qualities?: Quality[]) {
    super(id);
    this.name = name;
    this.qualities = qualities ?? [];
  }

  hasQuality(quality: Quality): boolean {
    const match = this.qualities.find((q) => q.is(quality));
    return typeof match !== 'undefined';
  }
}

export default Organism;
