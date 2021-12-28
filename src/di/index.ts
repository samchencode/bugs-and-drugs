import { Injector } from 'didi';
import dependencies from '@/di/dependencies';

const container = new Injector([dependencies]);

export default container;
