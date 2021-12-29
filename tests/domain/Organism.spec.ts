import Organism from '@/domain/Organism';

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
});
