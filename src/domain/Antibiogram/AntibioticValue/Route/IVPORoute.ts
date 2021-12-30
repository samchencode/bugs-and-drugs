import ValueObject from '@/domain/base/ValueObject';
import type { Route } from '@/domain/Antibiogram/AntibioticValue/Route/Route';

class IVPORoute extends ValueObject implements Route {
  protected isIdentical(): boolean {
    return true;
  }

  toString() {
    return 'IV/PO';
  }
}

export default IVPORoute;
