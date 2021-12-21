class Organism {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  equals(org: Organism) {
    return this.id === org.id;
  }
}

export default Organism;
