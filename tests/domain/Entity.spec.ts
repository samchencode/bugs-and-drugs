import Entity from '@/domain/base/Entity';
import EntityId from '@/domain/base/EntityId';

describe('Entity', () => {
  class AId extends EntityId {
    constructor(id: string) {
      super(id);
    }
  }

  class BId extends EntityId {
    constructor(id: string) {
      super(id);
    }
  }

  class A extends Entity {
    constructor() {
      super(new AId('1'));
    }
  }
  class B extends Entity {
    constructor() {
      super(new BId('1'));
    }
  }

  it('should make class specific comparisons', () => {
    const a = new A();
    const a2 = new A();
    const b = new B();

    expect(a.is(a)).toBe(true);
    expect(a.is(a2)).toBe(true);
    expect(a.is(b)).toBe(false);
  });

  it('should compare ids', () => {
    const a = new A();
    const a2 = new A();
    const aDiff = new A();
    aDiff.id = new AId('2');

    expect(a.is(a)).toBe(true);
    expect(a.is(a2)).toBe(true);
    expect(a.is(aDiff)).toBe(false);
  });
});
