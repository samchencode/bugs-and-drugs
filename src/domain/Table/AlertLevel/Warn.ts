import AlertLevel from '@/domain/Table/AlertLevel/AlertLevel';

class Warn extends AlertLevel {
  readonly level: string = 'warn';

  valueOf(): number {
    return 1;
  }
}

export default Warn;
