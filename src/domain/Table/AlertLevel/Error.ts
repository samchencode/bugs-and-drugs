import AlertLevel from '@/domain/Table/AlertLevel/AlertLevel';

class Error extends AlertLevel {
  readonly level: string = 'error';

  valueOf(): number {
    return 2;
  }
}

export default Error;
