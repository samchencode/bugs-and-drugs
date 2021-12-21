class Antibiotic {
  id: number;
  name: string;

  constructor(id: number, name: string) {
    this.id = id;
    this.name = name;
  }

  equals(abx: Antibiotic) {
    return this.id === abx.id
  }
}

export default Antibiotic;