import { Module } from 'didi';
import svelte from '@/di/svelte';
import TableController from '@/infrastructure/view/controllers/TableController';
import AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import FakeAntibiogramRepository from '@/infrastructure/persistence/fake/FakeAntibiogramRepository';
import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import IndexAntibiogramGroupsAction from '@/application/IndexAntibiogramGroupsAction';
import WebAntibiogramGroupsPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';

const dependencies = new Module();

// * PORTS
// * - Actions
dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
dependencies.type('indexAntibiogramGroupsAction', IndexAntibiogramGroupsAction);

// * ADAPTERS
// * - Repositories
dependencies.type('antibiogramRepository', FakeAntibiogramRepository);
// * - Controllers
dependencies.type('tableController', TableController);
dependencies.type('antibiogramGroupController', AntibiogramGroupController);
// * - Presenter
dependencies.type(
  'webAntibiogramGroupsPresenter',
  WebAntibiogramGroupsPresenter
);

dependencies.factory('svelte', svelte);

export default dependencies;
