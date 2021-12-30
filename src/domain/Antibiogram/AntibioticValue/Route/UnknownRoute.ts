import ValueObject from '@/domain/base/ValueObject';
import type { Route } from '@/domain/Antibiogram/AntibioticValue/Route/Route';

class UnknownRoute extends ValueObject implements Route {
  protected isIdentical(): boolean {
    return true;
  }

  toString() {
    return 'unknown';
  }
}

export default UnknownRoute;
