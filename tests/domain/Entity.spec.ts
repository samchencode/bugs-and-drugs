import Entity from '@/domain/Entity';

describe('Entity', () => {
  class A extends Entity {
    id = 1;
  }
  class B extends Entity {
    id = 1;
  }

  it('should make class specific comparisons', () => {
    const a = new A();
    const a2 = new A();
    const b = new B();

    expect(a.equals(a)).toBe(true);
    expect(a.equals(a2)).toBe(true);
    expect(a.equals(b)).toBe(false);
  });

  it('should compare ids', () => {
    const a = new A();
    const a2 = new A();
    const aDiff = new A();
    aDiff.id = 2;

    expect(a.equals(a)).toBe(true);
    expect(a.equals(a2)).toBe(true);
    expect(a.equals(aDiff)).toBe(false);
  })
});
