import Organism, { NullOrganism, OrganismId } from '@/domain/Organism';
import { GramStain } from '@/domain/Organism/Quality';
import { Result as G } from '@/domain/Organism/Quality/GramStain';
import type { OrganismRepository } from '@/domain/ports/OrganismRepository';

const fakeData = [
  new Organism(
    '68b5b577-3dd3-4ca5-ba46-fc393e5f4730',
    'Staphylococcus aureus',
    [new GramStain(G.POSITIVE)]
  ),
  new Organism(
    '96c6e69e-75be-4af9-a8a0-75938c7a9b8a',
    'Staphylococcus epidermidis',
    [new GramStain(G.POSITIVE)]
  ),
  new Organism(
    '3c179c20-18a6-4234-a8d9-b16699d33003',
    'Staphylococcus haemolyticus',
    [new GramStain(G.POSITIVE)]
  ),
  new Organism(
    '5fed64e1-a45d-4962-b461-029a100ac99f',
    'Pseudomonas aeruginosa',
    [new GramStain(G.NEGATIVE)]
  ),
  new Organism('8be56ade-55c8-4f25-9663-a47678f4f4c6', 'Escherichia coli', [
    new GramStain(G.NEGATIVE),
  ]),
];

class FakeOrganismRepository implements OrganismRepository {
  async getById(id: string): Promise<Organism> {
    const match = fakeData.find((o) => o.id.is(new OrganismId(id)));
    return match ?? new NullOrganism();
  }
  async getAll(): Promise<Organism[]> {
    return fakeData;
  }
}

export default FakeOrganismRepository;
