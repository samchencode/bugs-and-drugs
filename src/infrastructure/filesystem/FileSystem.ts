import type { File } from '@/infrastructure/filesystem/File';

interface FileSystem {
  getFile(uri: string): File;
  getDataFile(name: string): File;
}

export type { FileSystem };
