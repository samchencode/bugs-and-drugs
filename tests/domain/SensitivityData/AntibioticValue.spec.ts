import {
  SingleAntibioticValue,
  SynergisticAntibioticValue,
  Routes,
} from '@/domain/Antibiogram';

describe('antibiotic value', () => {
  describe('antibiotic route', () => {
    it('should have unknown route by default', () => {
      const abx1 = new SingleAntibioticValue('Vancomycin');
      expect(abx1.getRoute().is(Routes.UNKNOWN));
      expect(abx1.getRoute().toString()).toBe('unknown');
    });

    it('should store route of antibiotic', () => {
      const abx1 = new SingleAntibioticValue('Vancomycin', Routes.IV);
      expect(abx1.getRoute().is(Routes.IV)).toBe(true);
      expect(abx1.getRoute().toString()).toBe('IV');
    });
    it('should differentiate abx with diff route', () => {
      const abx1 = new SingleAntibioticValue('Augmentin', Routes.IV);
      const abx2 = new SingleAntibioticValue('Augmentin', Routes.IV_PO);
      expect(abx1.is(abx2)).toBe(false);
      expect(abx1.isSameAntibiotic(abx2)).toBe(true);
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

    it('should recognize when synergistic abx is made up of same abx with diff route', () => {
      const abx1 = new SingleAntibioticValue('Neomycin');
      const abx1a = new SingleAntibioticValue('Neomycin', Routes.IV);
      const abx2 = new SingleAntibioticValue('Polymixin B');
      const abx2a = new SingleAntibioticValue('Polymixin B', Routes.IV);
      const synergisticAbx = new SynergisticAntibioticValue([abx1, abx2]);
      const synergisticAbxWithRoutes = new SynergisticAntibioticValue([
        abx1a,
        abx2a,
      ]);
      expect(synergisticAbx.is(synergisticAbxWithRoutes)).toBe(false);
      expect(synergisticAbx.isSameAntibiotic(synergisticAbxWithRoutes)).toBe(
        true
      );
      expect(synergisticAbxWithRoutes.isSameAntibiotic(abx1a)).toBe(false);
    });
  });
});
