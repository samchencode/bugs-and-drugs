import IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import Antibiogram from '@/domain/Antibiogram';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';

describe('IndexAntibiogramAction - shows unique places and intervals', () => {
  let action: IndexAntibiogramAction;
  const repo = new FakeAntibiogramRepository();

  beforeEach(() => {
    action = new IndexAntibiogramAction(repo);
  });

  it('should get all antibiograms', () => {
    return action.execute().then((result) => {
      expect(result).toEqual(expect.arrayContaining([expect.any(Antibiogram)]));
      expect(result.length).toBe(3);
    });
  });

  it('should set data on presenter', () => {
    const mockPresenter = {
      setData: jest.fn(),
    };

    return action.present(mockPresenter).then((presenter) => {
      expect(presenter.setData).toHaveBeenCalled();

      const calledWith = mockPresenter.setData.mock.calls[0][0];
      const expected = expect.arrayContaining(
        FakeAntibiogramRepository.fakeAntibiograms
      );

      expect(calledWith).toEqual(expected);
    });
  });
});
