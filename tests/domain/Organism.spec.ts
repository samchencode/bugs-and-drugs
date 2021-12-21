import Organism from '@/domain/Organism';

describe('Organism', () => {
  let organism: Organism;

  beforeEach(() => {
    organism = new Organism(1, 'Klebsiella');
  });

  it('should create new organism with name and id', () => {
    expect(organism).toBeDefined();
  });

  it('should be able to retrieve the name and ID of the abx', () => {
    expect(organism.id).toBe(1);
    expect(organism.name).toBe('Klebsiella');
  });

  it('should equal another organism of same id', () => {
    const sameAbx = new Organism(1, 'Klebsiella pneumoniae');
    const diffAbx = new Organism(2, 'Yersina pestis');

    expect(organism.equals(sameAbx)).toBe(true);
    expect(organism.equals(diffAbx)).toBe(false);
  })
});