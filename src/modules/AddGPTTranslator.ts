import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';

const AddGPTTranslator: ModuleDefinition = {
  name: '添加GPT翻译器',
  type: 'onclick',
  whitelist: '/workspace/gpt',
  settings: [
    { name: '数量', type: 'number', value: 5 },
    { name: '名称', type: 'string', value: 'NTR translator ' },
    { name: '模型', type: 'string', value: 'deepseek-chat' },
    { name: '链接', type: 'string', value: 'https://api.deepseek.com' },
    { name: 'Key', type: 'string', value: 'sk-wait-for-input' },
    { name: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const totalCount = cfg.settings.find((s) => s.name === '数量')?.value || 1;
    const namePrefix = cfg.settings.find((s) => s.name === '名称')?.value || '';
    const model = cfg.settings.find((s) => s.name === '模型')?.value || '';
    const apiKey = cfg.settings.find((s) => s.name === 'Key')?.value || '';
    const apiUrl = cfg.settings.find((s) => s.name === '链接')?.value || '';

    await StorageService.addGPTWorker(namePrefix, model, apiUrl, apiKey, totalCount);
    NotificationService.showSuccess(`成功添加 ${totalCount} 个 GPT 翻译器`);
  },
};

export default AddGPTTranslator;
