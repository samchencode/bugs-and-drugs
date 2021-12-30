import ValueObject from '@/domain/base/ValueObject';
import type { Route } from '@/domain/Antibiogram/AntibioticValue/Route/Route';

class PORoute extends ValueObject implements Route {
  protected isIdentical(): boolean {
    return true;
  }

  toString() {
    return 'PO';
  }
}

export default PORoute;
