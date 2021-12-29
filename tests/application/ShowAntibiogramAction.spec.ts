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
    const dummyParams = { id: -1 };
    const spy = jest.fn();
    showAbg.execute(dummyParams, spy);

    expect(spy).toBeCalledWith(expect.any(Table));
  });
});
