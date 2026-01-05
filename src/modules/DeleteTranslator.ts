import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';
import { ModuleId, SettingId } from '../constants';

const DeleteTranslator: ModuleDefinition = {
  id: ModuleId.DeleteTranslator,
  label: '删除翻译器',
  type: 'onclick',
  whitelist: '/workspace',
  settings: [
    { id: SettingId.Exclude, label: '排除', type: 'string', value: '共享,本机,AutoDL' },
    { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const excludeStr = cfg.settings.find((s) => s.id === SettingId.Exclude)?.value || '';
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
