import {
  AntibioticValue,
  SynergisticAntibioticValue,
  OrganismValue,
  SensitivityData,
  SensitivityValue,
} from '@/domain/Antibiogram';
import FakeOrganismRepository from '@/infrastructure/persistence/fake/FakeOrganismRepository';

describe('Sensitivty Data', () => {
  it('should create new sensitivity data', () => {
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella'),
    });

    expect(data).toBeDefined();
    const value = data.getValue();
    expect(value).toBeInstanceOf(SensitivityValue);
    const abx = data.getAntibiotic();
    expect(abx).toBeInstanceOf(AntibioticValue);
    const org = data.getOrganism();
    expect(org).toBeInstanceOf(OrganismValue);

    expect(value.getValue()).toBe(90);
    expect(abx.getName()).toBe('Azithromycin');
    expect(org.getName()).toBe('Klebsiella');
  });

  it('should associate sensitivity data with Organism entity', () => {
    const [org] = FakeOrganismRepository.data;
    const data = new SensitivityData({
      value: new SensitivityValue('90'),
      antibiotic: new AntibioticValue('Azithromycin'),
      organism: new OrganismValue('Klebsiella', org),
    });
    expect(data.getOrganism().getOrganism()?.id.is(org.id)).toBe(true);
  });

  describe('antibiotic synergy', () => {
    it('should create new antibiotic value that holds two synergystic antibiotics', () => {
      const abx1 = new AntibioticValue('Neomycin');
      const abx2 = new AntibioticValue('Polymixin B');
      const synergisticAbx = new SynergisticAntibioticValue([abx1, abx2]);

      expect(synergisticAbx).toBeDefined();
      expect(synergisticAbx.is(abx1)).toBe(false);
      expect(synergisticAbx.is(abx2)).toBe(false);
    });

    it('should equate synergistic antibiotics holding same antibiotic values', () => {
      const abx1 = new AntibioticValue('Neomycin');
      const abx2 = new AntibioticValue('Polymixin B');
      const abx3 = new AntibioticValue('Penicillin V');
      const synergisticAbx = new SynergisticAntibioticValue([abx1, abx2]);

      expect(
        synergisticAbx.is(new SynergisticAntibioticValue([abx1, abx2]))
      ).toBe(true);
      expect(
        synergisticAbx.is(new SynergisticAntibioticValue([abx2, abx1]))
      ).toBe(true);
      expect(
        synergisticAbx.is(new SynergisticAntibioticValue([abx2, abx3]))
      ).toBe(false);
    });

    it('should combine the names of synergistic abx to one', () => {
      const abx1 = new AntibioticValue('Neomycin');
      const abx2 = new AntibioticValue('Polymixin B');
      const syn = new SynergisticAntibioticValue([abx1, abx2]);
      expect(syn.getName()).toBe('Neomycin + Polymixin B');
    });
  });
});
