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
}

export default Interval;
