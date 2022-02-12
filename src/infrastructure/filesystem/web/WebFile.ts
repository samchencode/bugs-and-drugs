import type { File } from '@/infrastructure/filesystem/File';
import type { Fetch } from '@/infrastructure/filesystem/web/Fetch';

class WebFile implements File {
  #uri: string;
  #fetch: Fetch;

  constructor(fetch: Fetch, uri: string) {
    this.#uri = uri;
    this.#fetch = fetch;
    this.#validateUri(uri);
  }

  async getContents(): Promise<string> {
    return await this.#fetch(this.#uri).then((r) => r.text());
  }

  #validateUri(uri: string) {
    if (uri[0] !== '/') throw new UriNotAbsoluteError(uri);
  }
}

class UriNotAbsoluteError extends Error {
  constructor(uri: string) {
    super('Uri path must be absolute for file uri: ' + uri);
  }
}

export default WebFile;
