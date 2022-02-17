import None from '@/domain/Table/AlertLevel/None';
import Info from '@/domain/Table/AlertLevel/Info';
import Warn from '@/domain/Table/AlertLevel/Warn';
import Error from '@/domain/Table/AlertLevel/Error';

export { default as AlertLevel } from '@/domain/Table/AlertLevel/AlertLevel';
export const AlertLevels = {
  get NONE() {
    return new None();
  },
  get INFO() {
    return new Info();
  },
  get WARN() {
    return new Warn();
  },
  get ERROR() {
    return new Error();
  },
};
