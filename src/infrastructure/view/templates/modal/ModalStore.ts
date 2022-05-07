import about from '@/infrastructure/view/templates/dialogues/about';
import type { Dialogue } from '@/infrastructure/view/templates/dialogues/Dialogue';
import disclaimer from '@/infrastructure/view/templates/dialogues/disclaimer';
import { writable, type Writable } from 'svelte/store';

interface Modal extends Dialogue {
  hidden: boolean;
}

const modalStore: Writable<Modal> = writable({
  hidden: true,
  header: '',
  body: '',
  dismiss: '',
});

const { subscribe, set } = modalStore;

const showModal = (dialog: Dialogue) => set({ hidden: false, ...dialog });

const showDisclaimer = () => showModal(disclaimer);
const showAbout = () => showModal(about);

const hideModal = () =>
  set({
    hidden: true,
    header: '',
    body: '',
    dismiss: '',
  });

export const modal = {
  subscribe,
  showDisclaimer,
  showAbout,
  hideModal,
};
