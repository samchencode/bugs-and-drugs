import { Injector } from 'didi';
import dependencies from '@/di/dependencies';

const container = new Injector([dependencies]);

container.get('test');

export default container;