import ValueObject from '@/domain/base/ValueObject';

class Interval extends ValueObject {
  #publishedAt: Date;
  #expiresAt: Date;

  constructor(publishedAt: Date, expiresAt: Date) {
    super();
    this.#publishedAt = publishedAt;
    this.#expiresAt = expiresAt;
  }

  getPublishedDate(): Date {
    return this.#publishedAt;
  }

  getExpiryDate(): Date {
    return this.#expiresAt;
  }

  protected isIdentical(v: Interval): boolean {
    if (v.getPublishedDate().getTime() !== this.#publishedAt.getTime())
      return false;
    if (v.getExpiryDate().getTime() !== this.#expiresAt.getTime()) return false;
    return true;
  }

  toString(): string {
    return this.publishedAtToString() + ' \u2212 ' + this.expiresAtToString();
  }

  publishedAtToString(): string {
    return this.#dateToString(this.#publishedAt);
  }

  expiresAtToString(): string {
    return this.#dateToString(this.#expiresAt);
  }

  #dateToString(d: Date): string {
    return d.toLocaleString('en-us', {
      month: 'short',
      year: 'numeric',
    });
  }
}

class DefaultInterval extends Interval {
  constructor() {
    const today = new Date();
    const janThisYear = new Date(today.getFullYear(), 0);
    const janOneYearLater = new Date(today.getFullYear() + 1, 0);
    super(janThisYear, janOneYearLater);
  }
}

export default Interval;
export { DefaultInterval };
