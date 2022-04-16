import Place from '@/domain/Antibiogram/Place';

describe('Place', () => {
  describe('instantiation', () => {
    it('creates a place', () => {
      const place = new Place('NY', 'Gotham City Hospital');
      expect(place).not.toBeNull();
    });
  });

  describe('behavior', () => {
    let place: Place;

    beforeEach(() => {
      place = new Place('NY', 'Gotham City Hospital');
    });

    it('should get the state and institution', () => {
      expect(place.getState()).toBe('NY');
      expect(place.getInstitution()).toBe('Gotham City Hospital');
    });

    it('should convert itself to a human readable string', () => {
      expect(place + '').toBe('Gotham City Hospital \u2212 NY');
    });

    it('should be equal to place object with identical institution and state', () => {
      const result = place.is(new Place('NY', 'Gotham City Hospital'));
      const result2 = place.is(new Place('CA', 'Long Beach'));
      expect(result).toBe(true);
      expect(result2).toBe(false);
    });
  });
});
