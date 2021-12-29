import type Antibiogram from '@/domain/Antibiogram';

interface AntibiogramRepository {
  getAll(): Promise<Antibiogram[]>;
}

export type { AntibiogramRepository };
