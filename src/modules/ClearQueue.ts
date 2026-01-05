import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';
import { ModuleId, SettingId } from '../constants';

const ClearQueue: ModuleDefinition = {
  id: ModuleId.ClearQueue,
  label: '清空任务队列',
  type: 'onclick',
  whitelist: '/workspace',
  settings: [
    { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async () => {
    if (location.href.includes('gpt')) {
      await StorageService.removeAllJobs(StorageService.gptKey);
      NotificationService.showSuccess('已清空 GPT 任务队列');
    } else if (location.href.includes('sakura')) {
      await StorageService.removeAllJobs(StorageService.sakuraKey);
      NotificationService.showSuccess('已清空 Sakura 任务队列');
    }
  },
};

export default ClearQueue;
