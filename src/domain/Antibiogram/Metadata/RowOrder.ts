import Order from '@/domain/Antibiogram/Metadata/Order';

class RowOrder extends Order {
  static readonly slug = 'row-order';

  getSlug() {
    return RowOrder.slug;
  }
}

export default RowOrder;
