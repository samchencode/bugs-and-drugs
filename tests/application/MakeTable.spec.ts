import MakeAntibiogram from '@/application/MakeTable';

describe.skip('retrieving antibiogram table', () => {
  it('should make new antibiogram with no values', () => {
    const command = new MakeAntibiogram({
      //sensitivityData,
    });
    const table = command.execute();
    expect(table.isEmpty()).toBe(true);
  });

  it('should make new table with initial values', () => {
    const command = new MakeAntibiogram([

    ]);
    const table = command.execute();
    expect(table.isEmpty()).toBe(false);
    expect(table.loc(0, 1).toBe(99));
  });

});
