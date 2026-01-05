import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';

const DeleteTranslator: ModuleDefinition = {
  name: '删除翻译器',
  type: 'onclick',
  whitelist: '/workspace',
  settings: [
    { name: '排除', type: 'string', value: '共享,本机,AutoDL' },
    { name: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const excludeStr = cfg.settings.find((s) => s.name === '排除')?.value || '';
    const excludeArr = excludeStr.split(',').filter((x: string) => x);

    if (location.href.endsWith('gpt')) {
      await StorageService.removeAllWorkers(StorageService.gptKey, excludeArr);
      NotificationService.showSuccess('已删除 GPT 翻译器');
    } else if (location.href.endsWith('sakura')) {
      await StorageService.removeAllWorkers(StorageService.sakuraKey, excludeArr);
      NotificationService.showSuccess('已删除 Sakura 翻译器');
    }
  },
};

export default DeleteTranslator;
