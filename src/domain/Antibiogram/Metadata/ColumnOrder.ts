import Order from '@/domain/Antibiogram/Metadata/Order';

class ColumnOrder extends Order {
  static readonly slug = 'column-order';

  getSlug() {
    return ColumnOrder.slug;
  }

  protected isIdentical(v: ColumnOrder): boolean {
    if (v.getValue().length !== this.getValue().length) return false;
    if (v.getValue().find((f, i) => this.getValue()[i] !== f)) return false;
    return true;
  }
}

export default ColumnOrder;
