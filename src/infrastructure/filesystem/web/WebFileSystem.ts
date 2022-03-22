import type { FileSystem } from '@/infrastructure/filesystem/FileSystem';
import type { Fetch } from '@/infrastructure/filesystem/web/Fetch';
import WebFile from '@/infrastructure/filesystem/web/WebFile';
import { GH_PAGES_URL_PREFIX } from '@/constants';

const PUBLIC_DATA_DIR = 'data/';

class WebFileSystem implements FileSystem {
  #fetch: Fetch;

  constructor(fetch: Fetch) {
    this.#fetch = fetch;
  }

  getDataFile(name: string): WebFile {
    return this.getFile(this.#resolve(PUBLIC_DATA_DIR, name));
  }

  getFile(uri: string): WebFile {
    return new WebFile(this.#fetch, this.#resolve(GH_PAGES_URL_PREFIX, uri));
  }

  #resolve(base: string, ...paths: string[]) {
    if (base === '') throw Error('Invalid uri: ');

    const exploded = paths.flatMap((p) => p.split('/')).filter((p) => p !== '');
    if (base[0] !== '/') return '/' + base + exploded.join('/');
    if (base === '/') return '/' + exploded.join('/');
    return base + '/' + exploded.join('/');
  }
}

export default WebFileSystem;
