import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';

const AddSakuraTranslator: ModuleDefinition = {
  name: '添加Sakura翻译器',
  type: 'onclick',
  whitelist: '/workspace/sakura',
  settings: [
    { name: '数量', type: 'number', value: 5 },
    { name: '名称', type: 'string', value: 'NTR translator ' },
    { name: '链接', type: 'string', value: 'https://sakura-share.one' },
    { name: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const totalCount = cfg.settings.find((s) => s.name === '数量')?.value || 1;
    const namePrefix = cfg.settings.find((s) => s.name === '名称')?.value || '';
    const linkValue = cfg.settings.find((s) => s.name === '链接')?.value || '';

    await StorageService.addSakuraWorker(namePrefix, linkValue, totalCount);
    NotificationService.showSuccess(`成功添加 ${totalCount} 个 Sakura 翻译器`);
  },
};

export default AddSakuraTranslator;
