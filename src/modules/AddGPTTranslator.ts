import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';
import { ModuleId, SettingId } from '../constants';

const AddGPTTranslator: ModuleDefinition = {
  id: ModuleId.AddGPTTranslator,
  label: '添加GPT翻译',
  type: 'onclick',
  whitelist: '/workspace/gpt',
  settings: [
    { id: SettingId.Count, label: '数量', type: 'number', value: 5 },
    { id: SettingId.NamePrefix, label: '名称', type: 'string', value: 'NTR translator ' },
    { id: SettingId.Model, label: '模型', type: 'string', value: 'deepseek-chat' },
    { id: SettingId.Endpoint, label: '链接', type: 'string', value: 'https://api.deepseek.com' },
    { id: SettingId.ApiKey, label: 'Key', type: 'string', value: 'sk-wait-for-input' },
    { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' }
  ],
  run: async (cfg) => {
    const val = (id: string) => cfg.settings.find((s) => s.id === id)?.value;

    const count = val(SettingId.Count) || 1;
    const name = val(SettingId.NamePrefix) || '';
    const model = val(SettingId.Model) || '';
    const endpoint = val(SettingId.Endpoint) || '';
    const key = val(SettingId.ApiKey) || '';

    await StorageService.addGPTWorker(name, model, endpoint, key, count);
    NotificationService.showSuccess(`成功添加 ${count} 个 GPT 翻译器`);
  }
};

export default AddGPTTranslator;
