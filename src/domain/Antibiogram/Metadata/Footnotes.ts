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

  isNull(){return false}
  
  protected isIdentical(v: Footnotes): boolean {
    if (v.getValue().length !== this.getValue().length) return false;
    if (v.getValue().find((f, i) => this.getValue()[i] !== f)) return false;
    return true;
  }
}

export default Footnotes;
