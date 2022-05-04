import ShowGramPositiveAndNegativeAntibiogramAction from '@/application/ShowGramPositiveAndNegativeAntibiogramAction';
import Antibiogram from '@/domain/Antibiogram';
import TableFacade from '@/domain/Table/Facade/TableFacade';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('ShowAntibiogramAction', () => {
  let repo: FakeAntibiogramRepository;
  let action: ShowGramPositiveAndNegativeAntibiogramAction;

  beforeEach(() => {
    repo = new FakeAntibiogramRepository();
    action = new ShowGramPositiveAndNegativeAntibiogramAction(repo);
  });

  it('should show two antibiogram on one table separated by header with gram value', () => {
    return action.execute('0', '2').then(({ table }) => {
      expect(table.getCells().length).toBe(9);

      const labels = table.getRowLabels().map((l) => l.toString());
      expect(labels[0]).toBe('Gram Positive');
      expect(labels[5]).toBe('Gram Positive and Negative');
    });
  });

  it('should setData on a presenter', () => {
    const mockPresenter = {
      setData: jest.fn(),
    };

    return action.present(mockPresenter, '0', '2').then((presenter) => {
      expect(presenter.setData).toHaveBeenCalled();

      const calledWith = mockPresenter.setData.mock.calls[0][0];
      const expected = expect.objectContaining({
        table: expect.any(TableFacade),
        antibiogram: expect.any(Antibiogram),
      });

      expect(calledWith).toEqual(expected);
    });
  });
});
