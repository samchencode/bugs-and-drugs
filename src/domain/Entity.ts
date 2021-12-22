abstract class Entity {
  id: any;

  equals(e: Entity) {
    const { constructor } = Object.getPrototypeOf(e);
    if (!(this instanceof constructor)) return false;
    return this.id === e.id;
  }
}

export default Entity;
