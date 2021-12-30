import Organism, { NullOrganism, OrganismId } from '@/domain/Organism';
import { GramStain } from '@/domain/Organism/Quality';
import { Result as G } from '@/domain/Organism/Quality/GramStain';
import type { OrganismRepository } from '@/domain/ports/OrganismRepository';

const fakeData = [
  new Organism(new OrganismId('0'), 'Klebsiella'),
  new Organism(new OrganismId('1'), 'Staphylococcus aureus', [
    new GramStain(G.POSITIVE),
  ]),
  new Organism(new OrganismId('2'), 'Staphylococcus epidermidis', [
    new GramStain(G.POSITIVE),
  ]),
  new Organism(new OrganismId('3'), 'Staphylococcus haemolyticus', [
    new GramStain(G.POSITIVE),
  ]),
  new Organism(new OrganismId('4'), 'Pseudomonas aeruginosa', [
    new GramStain(G.NEGATIVE),
  ]),
  new Organism(new OrganismId('5'), 'Escherichia coli', [
    new GramStain(G.NEGATIVE),
  ]),
];

class FakeOrganismRepository implements OrganismRepository {
  async getById(id: OrganismId): Promise<Organism> {
    const match = fakeData.find((o) => o.id.is(id));
    return match ?? new NullOrganism();
  }

  async getAll(): Promise<Organism[]> {
    return fakeData;
  }

  static data = fakeData;
}

export default FakeOrganismRepository;
