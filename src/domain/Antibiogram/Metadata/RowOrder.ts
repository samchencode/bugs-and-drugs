import Order from '@/domain/Antibiogram/Metadata/Order';

class RowOrder extends Order {
  static readonly slug = 'row-order';

  getSlug() {
    return RowOrder.slug;
  }
  protected isIdentical(v: RowOrder): boolean {
    if (v.getValue().length !== this.getValue().length) return false;
    if (v.getValue().find((f, i) => this.getValue()[i] !== f)) return false;
    return true;
  }
}

export default RowOrder;
