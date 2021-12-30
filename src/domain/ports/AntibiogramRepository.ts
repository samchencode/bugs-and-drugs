import type Antibiogram from '@/domain/Antibiogram';
import type { AntibiogramId } from '@/domain/Antibiogram';

interface AntibiogramRepository {
  getById(id: AntibiogramId): Promise<Antibiogram>;
  getAll(): Promise<Antibiogram[]>;
}

export type { AntibiogramRepository };
