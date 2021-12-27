import type Antibiogram from '@/domain/Antibiogram';

interface AntibiogramRepository {
  getAll(): Antibiogram[];
}

export type { AntibiogramRepository };
