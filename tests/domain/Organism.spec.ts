import Organism from '@/domain/Organism';
import { GramStain } from '@/domain/Organism/Quality';
import { Result as G } from '@/domain/Organism/Quality/GramStain';

describe('Organism', () => {
  let organism: Organism;

  beforeEach(() => {
    organism = new Organism('1', 'Klebsiella');
  });

  it('should create new organism with name and id', () => {
    expect(organism).toBeDefined();
  });

  it('should be able to retrieve the name and ID of the abx', () => {
    expect(organism.id.getValue()).toBe('1');
    expect(organism.name).toBe('Klebsiella');
  });

  it('should equal another organism of same id', () => {
    const sameOrg = new Organism('1', 'Klebsiella pneumoniae');
    const diffOrg = new Organism('2', 'Yersina pestis');

    expect(organism.is(sameOrg)).toBe(true);
    expect(organism.is(diffOrg)).toBe(false);
  });

  it('can be gram positive or negative', () => {
    const gPositive = new Organism('1', 'Staph aureus', [
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
