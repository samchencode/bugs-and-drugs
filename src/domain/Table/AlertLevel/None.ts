import AlertLevel from '@/domain/Table/AlertLevel/AlertLevel';

class None extends AlertLevel {
  readonly level: string = 'none';

  valueOf(): number {
    return -1;
  }
}

export default None;
