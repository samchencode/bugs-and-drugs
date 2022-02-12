import WebFile from '@/infrastructure/filesystem/web/WebFile';

describe('WebFile', () => {
  const fetchFactory = (result: string) =>
    jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(result),
    });

  describe('instantiation', () => {
    const fetch = fetchFactory('');

    it('creates a new web file with a route', () => {
      new WebFile(fetch, '/foo.bar');
    });
  });

  describe('behavior', () => {
    const fetch = fetchFactory('Hello World');

    it('should run fetch and get data', () =>
      new WebFile(fetch, '/foo.bar').getContents().then((contents) => {
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('/foo.bar');
        expect(contents).toBe('Hello World');
      }));

    it('should throw error if given a non-absolute path uri', () => {
      const boom = () => new WebFile(fetch, 'foo.bar');
      expect(boom).toThrowError('Uri path must be absolute for file uri');
    });
  });
});
