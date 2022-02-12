interface File {
  getContents(): Promise<string>;
}

export type { File };
