import { Injector } from 'didi';
import type Stack from '@/domain/Stack';
import dependencies from '@/dependencies';

const container = new Injector([dependencies]);
const stack = container.get<Stack<any>>('stack');

console.log(stack);

container.get('test');
