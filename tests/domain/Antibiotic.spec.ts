import Antibiotic, { AntibioticId } from '@/domain/Antibiotic';

describe('Antibiotic', () => {
  let antibiotic: Antibiotic;

  beforeEach(() => {
    const id = new AntibioticId('1');
    antibiotic = new Antibiotic(id, 'Azithromycin');
  });

  it('should create new antibiotic with name and id', () => {
    expect(antibiotic).toBeDefined();
  });

  it('should be able to retrieve the name and ID of the abx', () => {
    expect(antibiotic.id.getValue()).toBe('1');
    expect(antibiotic.name).toBe('Azithromycin');
  });

  it('should equal another antibiotic of same id', () => {
    const sameAbx = new Antibiotic(new AntibioticId('1'), 'AzithroMax');
    const diffAbx = new Antibiotic(new AntibioticId('2'), 'Ampicillin');

    expect(antibiotic.is(sameAbx)).toBe(true);
    expect(antibiotic.is(diffAbx)).toBe(false);
  });
});
