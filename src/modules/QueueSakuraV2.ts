import { ModuleId } from '../constants';
import { createQueueModule } from './QueueFactory';

const QueueSakuraV2 = createQueueModule({
  id: ModuleId.QueueSakura,
  label: '排队Sakura v2',
  target: 'sakura'
});

export default QueueSakuraV2;
