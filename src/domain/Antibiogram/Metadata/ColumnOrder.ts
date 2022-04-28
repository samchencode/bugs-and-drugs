import Order from '@/domain/Antibiogram/Metadata/Order';

class ColumnOrder extends Order {
  static readonly slug: 'column-order';

  getSlug() {
    return ColumnOrder.slug;
  }
}

export default ColumnOrder;
