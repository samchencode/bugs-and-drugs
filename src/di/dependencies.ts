import { Module } from 'didi';
import App from '@/infrastructure/view/templates/App.svelte';
import TableController from '@/infrastructure/view/controllers/TableController';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';

const dependencies = new Module();

dependencies.type('antibiogramRepository', FakeAntibiogramRepository);
dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
dependencies.type('tableController', TableController);

dependencies.factory('svelte', (tableController) => {
  return new App({
    target: document.body,
    context: new Map([['tableController', tableController]]),
  });
});

export default dependencies;
