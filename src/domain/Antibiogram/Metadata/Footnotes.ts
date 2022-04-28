import MetadataValue from '@/domain/Antibiogram/Metadata/MetadataValue';

class Footnotes extends MetadataValue {
  static readonly slug = 'footnotes';
  #footnotes: string[];

  constructor(footnotes: string[]) {
    super();
    this.#footnotes = footnotes;
  }

  getSlug(): string {
    return Footnotes.slug;
  }
  getValue(): string[] {
    return this.#footnotes;
  }
}

export default Footnotes;
