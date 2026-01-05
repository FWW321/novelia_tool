import StorageService from '../services/StorageService';
import { ModuleId } from '../constants';
import { createQueueModule } from './QueueFactory';

const QueueGPTV2 = createQueueModule({
  id: ModuleId.QueueGPT,
  label: '排队GPT v2',
  target: 'gpt'
});

export default QueueGPTV2;
