import { Module } from 'didi';

const dependencies = new Module();

dependencies.factory('test', function (key: string) {
  console.log(key);
});

dependencies.value('key', 'Foo Bar Baz!');

export default dependencies;
