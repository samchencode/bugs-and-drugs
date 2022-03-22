import type { AntibiogramId } from '@/domain/Antibiogram';
import { writable, type Writable } from 'svelte/store';

interface AntibiogramNavigation {
  title: string;
  subtitle: string;
  id: AntibiogramId;
}

const { subscribe, set }: Writable<AntibiogramNavigation | null> =
  writable(null);

const navigate = (id: AntibiogramId) => {
  // get info about antibiogram here
  set(null);
};

export const Antibiograms = { subscribe, navigate };
