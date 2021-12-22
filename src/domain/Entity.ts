abstract class Entity {
  id: any;

  equals(e: Entity) {
    return this.id === e.id;
  }
}

export default Entity;
