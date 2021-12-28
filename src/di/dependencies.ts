import { Module } from 'didi';
import App from '@/view/App.svelte';

const dependencies = new Module();

dependencies.factory('test', function (key: string) {
  console.log(key);
  return 'testvalue';
});

dependencies.factory('svelte', (test) => {
  return new App({
    target: document.body,
    props: {
      name: 'bugs and drugs',
    },
    context: new Map([['inj', test]]),
  });
});

dependencies.value('key', 'Foo Bar Baz!');

export default dependencies;
