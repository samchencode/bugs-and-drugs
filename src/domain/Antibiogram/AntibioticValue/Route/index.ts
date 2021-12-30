export type { Route } from '@/domain/Antibiogram/AntibioticValue/Route/Route';
import IVPORoute from '@/domain/Antibiogram/AntibioticValue/Route/IVPORoute';
import PORoute from '@/domain/Antibiogram/AntibioticValue/Route/PORoute';
import IVRoute from '@/domain/Antibiogram/AntibioticValue/Route/IVRoute';
import UnknownRoute from '@/domain/Antibiogram/AntibioticValue/Route/UnknownRoute';

const routeFactory = {
  get IV_PO() {
    return new IVPORoute();
  },
  get PO() {
    return new PORoute();
  },
  get IV() {
    return new IVRoute();
  },
  get UNKNOWN() {
    return new UnknownRoute();
  },
};

export default routeFactory;
