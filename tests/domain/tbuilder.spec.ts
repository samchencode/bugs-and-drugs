import Antibiogram, {
  AntibiogramId,
  SampleInfo,
  Settings,
} from '@/domain/Antibiogram';
import algo, { algo2 } from '@/domain/AntibiogramTableBuilder/algo';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('testing the builder...', () => {
  const data = FakeAntibiogramRepository.data[2];
  const abg = new Antibiogram(new AntibiogramId('1'), data, {
    info: new SampleInfo([Settings.INPATIENT]),
  });

  test('idk', () => {
    const result = algo(abg);

    const printed = result.map((arr) =>
      arr.map((d) => d.getValue().toString())
    );

    const expected = [
      ['100%', '100%', 'R'],
      ['R', '81%', 'R', '4%'],
      ['90%', '90%', '95%'],
      ['86%', '92%', '96%'],
    ];

    expect(printed).toEqual(expected);
  });

  test('idk2', () => {
    const result = algo2(abg);
    const names = result.map((r) => r.abx.getName());
    const commons = result.map((r) => '' + r.commonSi);
    expect(names).toEqual([
      'Azithromycin',
      'Ampicillin',
      'Ampicillin',
      'Nitrofurantoin',
    ]);
    expect(commons).toEqual(['undefined', 'undefined', 'undefined', 'Urine']);
  });
});
