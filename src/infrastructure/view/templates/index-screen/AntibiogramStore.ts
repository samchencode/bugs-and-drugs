import { derived, writable, type Writable } from 'svelte/store';

interface Antibiogram {
  state: string;
  institution: string;
  interval: string;
  details: string;
  gramStain: string;
  id: number | null;
}

const antibiogramStore: Writable<Antibiogram> = writable({
  state: '',
  institution: '',
  interval: '',
  details: '',
  gramStain: '',
  id: null,
});

const { subscribe, set } = antibiogramStore;

const setAntibiogram = (
  state: string,
  institution: string,
  interval: string,
  details: string,
  gramStain: string,
  id: number
) => {
  set({
    state: state,
    institution: institution,
    interval: interval,
    details: details,
    gramStain: gramStain,
    id: id,
  });
};

const title = derived(antibiogramStore, ($abg) => {
  if ($abg.id == null) {
    return 'No antibiogram data';
  } else
    return `${$abg.institution}, ${$abg.state} : ${$abg.interval} ( ${$abg.details}, gram ${$abg.gramStain})`;
});

export const antibiogram = { subscribe, setAntibiogram };
export { title };
