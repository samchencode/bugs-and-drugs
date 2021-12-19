import { Module } from 'didi';
import Stack from '@/domain/Stack';
import type { Injector } from 'didi';

const dependencies = new Module();

dependencies.type('stack', Stack);
dependencies.factory('test', function (key: string) {
  console.log(key);
});

dependencies.value('key', 'Foo Bar Baz!');

export default dependencies;
