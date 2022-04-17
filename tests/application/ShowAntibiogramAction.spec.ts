import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import TableFacade from '@/domain/Table/Facade/TableFacade';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('ShowAntibiogramAction', () => {
  let repo: FakeAntibiogramRepository;
  let action: ShowAntibiogramAction;

  beforeEach(() => {
    repo = new FakeAntibiogramRepository();
    action = new ShowAntibiogramAction(repo);
  });

  it('should show antibiogram as table', () => {
    return action.execute('0').then((t) => {
      expect(t.getCells().length).toBe(3);
    });
  });

  it('should setData on a presenter', () => {
    const mockPresenter = {
      setData: jest.fn(),
    };

    return action.present(mockPresenter, '0').then((presenter) => {
      expect(presenter.setData).toHaveBeenCalled();

      const calledWith = mockPresenter.setData.mock.calls[0][0];
      const expected = expect.any(TableFacade);

      expect(calledWith).toEqual(expected);
    });
  });
});
