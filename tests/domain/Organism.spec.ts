import Organism, { OrganismId } from '@/domain/Organism';
import { GramStain } from '@/domain/Organism/Quality';
import { Result as G } from '@/domain/Organism/Quality/GramStain';
import FakeOrganismRepository from '@/infrastructure/persistence/fake/FakeOrganismRepository';

describe('Organism', () => {
  let organism: Organism, differentOrganism: Organism;

  beforeEach(() => {
    [organism, differentOrganism] = FakeOrganismRepository.data;
  });

  it('should create new organism with name and id', () => {
    const organism = new Organism(new OrganismId('1'));
    expect(organism).toBeDefined();
  });

  it('should be able to retrieve the name and ID of the abx', () => {
    expect(organism.id.getValue()).toBe('0');
    expect(organism.name).toBe('Klebsiella');
  });

  it('should equal another organism of same id', () => {
    expect(organism.is(organism)).toBe(true);
    expect(organism.is(differentOrganism)).toBe(false);
  });

  it('can be gram positive or negative', () => {
    const gPositive = new Organism(new OrganismId('1'), 'Staph aureus', [
      new GramStain(G.POSITIVE),
    ]);
    const isGramPositive = gPositive.hasQuality(new GramStain(G.POSITIVE));
    expect(isGramPositive).toBe(true);
    const isGramNegative = gPositive.hasQuality(new GramStain(G.NEGATIVE));
    expect(isGramNegative).toBe(false);
  });

  describe('gram stain', () => {
    it('should print the value of the quality', () => {
      const g = new GramStain(G.POSITIVE);
      expect('' + g).toBe('Gram Positive');
    });

    it('should be identical to same gram stain result', () => {
      const positive = G.POSITIVE;
      expect(positive.is(G.POSITIVE)).toBe(true);
      const g = new GramStain(G.POSITIVE);
      expect(g.is(new GramStain(G.POSITIVE))).toBe(true);
    });
  });
});
