abstract class Entity {
  id: any;

  equals(e: Entity) {
    const { constructor } = Object.getPrototypeOf(e);
    if (!(this instanceof constructor)) return false;
    return this.id === e.id;
  }

  static filterUniqueEntity<T extends Entity>(arr: T[]) {
    const memo = new Set();
    const isUnique = (e: Entity) => (memo.has(e.id) ? false : memo.add(e.id));
    return arr.filter(isUnique);
  }
}

export default Entity;
