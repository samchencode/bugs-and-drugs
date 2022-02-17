import AlertLevel from '@/domain/Table/AlertLevel/AlertLevel';

class Info extends AlertLevel {
  readonly level: string = 'info';

  valueOf(): number {
    return 0;
  }
}

export default Info;
