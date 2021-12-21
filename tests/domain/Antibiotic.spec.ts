import Antibiotic from '@/domain/Antibiotic';

describe('Antibiotic', () => {
  let antibiotic: Antibiotic;

  beforeEach(() => {
    antibiotic = new Antibiotic(1, 'Azithromycin');
  });

  it('should create new antibiotic with name and id', () => {
    expect(antibiotic).toBeDefined();
  });

  it('should be able to retrieve the name and ID of the abx', () => {
    expect(antibiotic.id).toBe(1);
    expect(antibiotic.name).toBe('Azithromycin');
  });

  it('should equal another antibiotic of same id', () => {
    const sameAbx = new Antibiotic(1, 'AzithroMax');
    const diffAbx = new Antibiotic(2, 'Ampicillin');

    expect(antibiotic.equals(sameAbx)).toBe(true);
    expect(antibiotic.equals(diffAbx)).toBe(false);
  });
});
