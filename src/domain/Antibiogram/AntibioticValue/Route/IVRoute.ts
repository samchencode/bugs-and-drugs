import ValueObject from '@/domain/base/ValueObject';
import type { Route } from '@/domain/Antibiogram/AntibioticValue/Route/Route';

class IVRoute extends ValueObject implements Route {
  protected isIdentical(): boolean {
    return true;
  }

  toString() {
    return 'IV';
  }
}

export default IVRoute;
