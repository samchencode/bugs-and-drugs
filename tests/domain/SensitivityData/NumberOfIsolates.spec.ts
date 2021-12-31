import {
  IntegerNumberOfIsolates,
  UnknownNumberOfIsolates,
} from '@/domain/Antibiogram/NumberOfIsolates';

describe('NumberOfIsolates interface', () => {
  /* 
    IDEA: make a class for displaying different types of numberofisolates
    
    interface IsolatesDisplayBehavior { ... }
    interface IntegerNumberOfIsolatesDisplayBehavior {
      new (int: IntegerNumberOfIsolates): this
    }
    interface UnknownNumberOfIsolatesDisplayBehavior {
      new (unk: UnknownNumberOfIsolates): this
    }
    if (data.getIsolates().isUnknown()) { ... }
  */

  describe('IntegerNumberOfIsolates Value Object', () => {
    it('should create a new numberOfIsolates object', () => {
      const isolates = new IntegerNumberOfIsolates(10);
      expect(isolates).toBeDefined();
    });

    it('should retrieve number of isolates as number', () => {
      const isolates = new IntegerNumberOfIsolates(10);
      expect(isolates.getValue()).toBe(10);
    });

    it('should label less than 30 isolates as not enough', () => {
      const isolates = new IntegerNumberOfIsolates(29);
      expect(isolates.isEnough()).toBe(false);
      const isolates2 = new IntegerNumberOfIsolates(30);
      expect(isolates2.isEnough()).toBe(true);
    });

    it('should throw error for decimal number of isolates', () => {
      const boom = () => new IntegerNumberOfIsolates(0.5);
      expect(boom).toThrowError('Non-integer number of isolates');
    });

    it('should throw error for negative number of isolates', () => {
      const boom = () => new IntegerNumberOfIsolates(-5);
      expect(boom).toThrowError('Negative number of isolates');
    });

    it('should not be unknown', () => {
      const isolates = new IntegerNumberOfIsolates(0);
      expect(isolates.isUnknown()).toBe(false);
    });
  });

  describe('unknown number of isolates', () => {
    it('should be unknown', () => {
      const isolates = new UnknownNumberOfIsolates();
      expect(isolates.isUnknown()).toBe(true);
    });

    it('should be serialized to unknown', () => {
      const isolates = new UnknownNumberOfIsolates();
      expect(isolates.toString()).toBe('unknown');
    });
  });
});
