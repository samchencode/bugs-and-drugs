import IndexAntibiogramTableAction from '@/application/IndexAntibiogramTableAction';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('ShowAntibiogramAction', () => {
  let repo: FakeAntibiogramRepository;
  let action: IndexAntibiogramTableAction;

  beforeEach(() => {
    repo = new FakeAntibiogramRepository();
    action = new IndexAntibiogramTableAction(repo);
  });

  it('should show antibiogram as table', () => {
    return action.execute().then((t) => {
      expect(t.length).toBe(3);
    });
  });
});
