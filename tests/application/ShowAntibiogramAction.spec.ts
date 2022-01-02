import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import Table from '@/domain/Table';

describe('ShowAntibiogramAction', () => {
  let repo: FakeAntibiogramRepository;
  let showAbg: ShowAntibiogramAction;

  beforeEach(() => {
    repo = new FakeAntibiogramRepository();
    showAbg = new ShowAntibiogramAction(repo);
  });

  it('should show antibiogram as table', () => {
    return showAbg.execute().then((t) => {
      expect(t).toBeInstanceOf(Table);
      expect(t.data.length).toBe(3);
    });
  });
});