import { Module } from 'didi';
import svelte from '@/di/svelte';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
import AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import CsvAntibiogramRepository from '@/infrastructure/persistence/csv/CsvAntibiogramRepository';
import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import WebAntibiogramGroupPresenter from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
import WebFileSystem from '@/infrastructure/filesystem/web/WebFileSystem';
import WebTablePresenter from '@/infrastructure/view/presenters/WebTablePresenter';

const dependencies = new Module();

// * PORTS
// * - Actions
dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
dependencies.type('indexAntibiogramGroupsAction', IndexAntibiogramAction);

// * ADAPTERS
// * - Repositories
dependencies.type('antibiogramRepository', CsvAntibiogramRepository);
dependencies.type('filesystem', WebFileSystem);
// * - Controllers
dependencies.type('antibiogramController', AntibiogramController);
dependencies.type('antibiogramGroupController', AntibiogramGroupController);
// * - Presenter
dependencies.type('webAntibiogramGroupPresenter', WebAntibiogramGroupPresenter);
dependencies.type('webTablePresenter', WebTablePresenter);

// * INJECTED EXTERNAL DEPENDENCIES
dependencies.value('fetch', fetch.bind(window));

dependencies.factory('svelte', svelte);

export default dependencies;
