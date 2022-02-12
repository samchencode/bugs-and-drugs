import WebFileSystem from '@/infrastructure/filesystem/web/WebFileSystem';

describe('WebFileSystem', () => {
  const fetchFactory = (result: string) =>
    jest.fn().mockResolvedValue({
      text: jest.fn().mockResolvedValue(result),
    });

  describe('instantiation', () => {
    const fetch = fetchFactory('Hello World');
    it('should create new fs', () => {
      new WebFileSystem(fetch);
    });
  });

  describe('behavior', () => {
    let fs: WebFileSystem;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let fetch: any;

    beforeEach(() => {
      fetch = fetchFactory('Hello World');
      fs = new WebFileSystem(fetch);
    });

    it('should resolve paths as absolute', () =>
      fs
        .getFile('foo.bar')
        .getContents()
        .then(() => {
          expect(fetch).toHaveBeenCalledWith('/foo.bar');
        }));

    it('should resolve data paths as absolute starting in the public/data directory', () =>
      fs
        .getDataFile('foo.bar')
        .getContents()
        .then(() => {
          expect(fetch).toHaveBeenCalledWith('/data/foo.bar');
        }));
  });
});
