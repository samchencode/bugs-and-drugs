import type EntityId from './EntityId';

abstract class Entity {
  id: EntityId;

  constructor(id: EntityId) {
    this.id = id;
  }

  is(e: Entity) {
    const { constructor } = Object.getPrototypeOf(e);
    if (!(this instanceof constructor)) return false;
    return this.id.is(e.id);
  }

  static filterUniqueEntity<T extends Entity>(arr: T[]) {
    const memo = new Set();
    const isUnique = (e: Entity) =>
      memo.has(e.id.getValue()) ? false : memo.add(e.id.getValue());
    return arr.filter(isUnique);
  }
}

export default Entity;
