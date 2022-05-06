import { writable, type Writable } from 'svelte/store';

interface Modal {
  hidden: boolean;
  title: string;
  text: string;
  hasInput: boolean;
  input: string;
}

const modalStore: Writable<Modal> = writable({
  hidden: true,
  title: '',
  text: '',
  hasInput: false,
  input: '',
});

const { subscribe, set, update } = modalStore;

const setModal = (
  hidden: boolean,
  title: string,
  text: string,
  hasInput: boolean
) => {
  set({
    hidden: hidden,
    title: title,
    text: text,
    hasInput: hasInput,
    input: '',
  });
};
const closeModal = () =>
  update(($modal) => {
    $modal.hidden = true;
    return $modal;
  });

export const modal = { subscribe, setModal, closeModal };
