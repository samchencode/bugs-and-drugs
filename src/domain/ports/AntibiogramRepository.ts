import type Antibiogram from '@/domain/Antibiogram';

interface AntibiogramRepository {
  getById(id: string): Promise<Antibiogram | null>;
  getAll(): Promise<Antibiogram[]>;
}

export type { AntibiogramRepository };
