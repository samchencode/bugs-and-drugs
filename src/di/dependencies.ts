import { Module } from 'didi';
import svelte from '@/di/svelte';
import AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
import AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
import FileAntibiogramRepository from '@/infrastructure/persistence/file/FileAntibiogramRepository';
import ShowAntibiogramAction from '@/application/ShowAntibiogramAction';
import IndexAntibiogramAction from '@/application/IndexAntibiogramAction';
import WebFileSystem from '@/infrastructure/filesystem/web/WebFileSystem';

const dependencies = new Module();

// * PORTS
// * - Actions
dependencies.type('showAntibiogramAction', ShowAntibiogramAction);
dependencies.type('indexAntibiogramGroupsAction', IndexAntibiogramAction);

// * ADAPTERS
// * - Repositories
dependencies.type('antibiogramRepository', FileAntibiogramRepository);
dependencies.type('filesystem', WebFileSystem);
// * - Controllers
dependencies.type('antibiogramController', AntibiogramController);
dependencies.type('antibiogramGroupController', AntibiogramGroupController);

// * INJECTED EXTERNAL DEPENDENCIES
dependencies.value('fetch', fetch.bind(window));

dependencies.factory('svelte', svelte);

export default dependencies;
