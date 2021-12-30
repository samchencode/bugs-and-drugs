import type Organism from '@/domain/Organism';
import type { OrganismId } from '@/domain/Organism';

interface OrganismRepository {
  getById(id: OrganismId): Promise<Organism>;
  getAll(): Promise<Organism[]>;
}

export type { OrganismRepository };
