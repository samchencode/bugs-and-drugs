import { Injector } from 'didi';
import dependencies from '@/dependencies';

const container = new Injector([dependencies]);

container.get('test');
