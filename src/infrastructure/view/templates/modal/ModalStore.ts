import about from '@/infrastructure/view/templates/dialogues/about';
import disclaimer from '@/infrastructure/view/templates/dialogues/disclaimer';
import { writable, type Writable } from 'svelte/store';

interface Modal {
  hidden: boolean;
  title: string;
  text: string;
}

const modalStore: Writable<Modal> = writable({
  hidden: true,
  title: '',
  text: '',
});

const { subscribe, set } = modalStore;

const showModal = (title: string, text: string) =>
  set({
    hidden: false,
    title: title,
    text: text,
  });

const showDisclaimer = () => showModal('Disclaimer', disclaimer);
const showAbout = () => showModal('About Us', about);

const hideModal = () =>
  set({
    hidden: true,
    title: '',
    text: '',
  });

export const modal = {
  subscribe,
  showDisclaimer,
  showAbout,
  hideModal,
};
