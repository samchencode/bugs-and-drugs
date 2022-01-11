import {
  SingleAntibioticValue,
  SynergisticAntibioticValue,
} from '@/domain/Antibiogram';
import Route from '@/domain/Antibiogram/AntibioticValue/Route';

describe('antibiotic value', () => {
  describe('antibiotic route', () => {
    it('should have unknown route by default', () => {
      const abx1 = new SingleAntibioticValue('Vancomycin');
      expect(abx1.getRoute().is(Route.UNKNOWN));
      expect(abx1.getRoute().toString()).toBe('unknown');
    });

    it('should store route of antibiotic', () => {
      const abx1 = new SingleAntibioticValue('Vancomycin', Route.IV);
      expect(abx1.getRoute().is(Route.IV)).toBe(true);
      expect(abx1.getRoute().toString()).toBe('IV');
    });
  });

  describe('antibiotic synergy', () => {
    it('should create new antibiotic value that holds two synergystic antibiotics', () => {
      const abx1 = new SingleAntibioticValue('Neomycin');
      const abx2 = new SingleAntibioticValue('Polymixin B');
      const synergisticAbx = new SynergisticAntibioticValue([abx1, abx2]);

      expect(synergisticAbx).toBeDefined();
      expect(synergisticAbx.is(abx1)).toBe(false);
      expect(synergisticAbx.is(abx2)).toBe(false);
    });

    it('should equate synergistic antibiotics holding same antibiotic values', () => {
      const abx1 = new SingleAntibioticValue('Neomycin');
      const abx2 = new SingleAntibioticValue('Polymixin B');
      const abx3 = new SingleAntibioticValue('Penicillin V');
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
      const abx1 = new SingleAntibioticValue('Neomycin');
      const abx2 = new SingleAntibioticValue('Polymixin B');
      const syn = new SynergisticAntibioticValue([abx1, abx2]);
      expect(syn.getName()).toBe('Neomycin + Polymixin B');
    });
  });
});
