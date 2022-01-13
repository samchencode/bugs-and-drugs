import ValueObject from '@/domain/base/ValueObject';
import type { AntibioticValue } from '@/domain/Antibiogram/AntibioticValue/AntibioticValue';
import Routes from '@/domain/Antibiogram/AntibioticValue/Route';
import type { Route } from '@/domain/Antibiogram/AntibioticValue/Route';

class SingleAntibioticValue extends ValueObject implements AntibioticValue {
  #name: string;
  #route: Route;

  constructor(name: string, route?: Route) {
    super();
    this.#name = name;
    this.#route = route ?? Routes.UNKNOWN;
  }

  getAntibiotics(): SingleAntibioticValue[] {
    return [this];
  }

  getRoute(): Route {
    return this.#route;
  }

  getName() {
    return this.#name;
  }

  isSameAntibiotic(v: AntibioticValue): boolean {
    if (!(v instanceof SingleAntibioticValue)) return false;
    return this.#name === v.getName();
  }

  protected isIdentical(antibioticValue: SingleAntibioticValue) {
    if (this.#name !== antibioticValue.getName()) return false;
    if (!this.#route.is(antibioticValue.getRoute())) return false;
    return true;
  }
}

export default SingleAntibioticValue;
