import type Organism from '@/domain/Organism';

interface OrganismRepository {
  getById(id: string): Promise<Organism>;
  getAll(): Promise<Organism[]>;
}

export type { OrganismRepository };
