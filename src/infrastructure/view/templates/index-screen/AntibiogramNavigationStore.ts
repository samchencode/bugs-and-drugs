import { derived, writable, type Writable } from 'svelte/store';

interface AntibiogramTitle {
  state: string;
  institution: string;
  interval: string;
  details: string;
  gramStain: string;
  id: number | null;
}

const antibiogramStore: Writable<AntibiogramTitle> = writable({
  state: '',
  institution: '',
  interval: '',
  details: '',
  gramStain: '',
  id: null,
});

const { subscribe, set } = antibiogramStore;

const setAntibiogram = (abgT: AntibiogramTitle) => {
  set({
    state: abgT.state,
    institution: abgT.institution,
    interval: abgT.interval,
    details: abgT.details,
    gramStain: abgT.gramStain,
    id: abgT.id,
  });
};

const title = derived(antibiogramStore, ($abg) => {
  if ($abg.id == null) {
    return 'No antibiogram data';
  } else
    return `${$abg.institution}, ${$abg.state} : ${$abg.interval} (${$abg.details}, gram ${$abg.gramStain})`;
});

export const antibiogram = { subscribe, setAntibiogram };
export { title };
