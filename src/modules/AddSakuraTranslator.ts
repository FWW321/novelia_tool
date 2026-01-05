import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';
import { ModuleId, SettingId } from '../constants';

const AddSakuraTranslator: ModuleDefinition = {
  id: ModuleId.AddSakuraTranslator,
  label: '添加Sakura翻译器',
  type: 'onclick',
  whitelist: '/workspace/sakura',
  settings: [
    { id: SettingId.Count, label: '数量', type: 'number', value: 5 },
    { id: SettingId.NamePrefix, label: '名称', type: 'string', value: 'NTR translator ' },
    { id: SettingId.Endpoint, label: '链接', type: 'string', value: 'https://sakura-share.one' },
    { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const val = (id: string) => cfg.settings.find((s) => s.id === id)?.value;

    const count = val(SettingId.Count) || 1;
    const name = val(SettingId.NamePrefix) || '';
    const endpoint = val(SettingId.Endpoint) || '';

    await StorageService.addSakuraWorker(name, endpoint, count);
    NotificationService.showSuccess(`成功添加 ${count} 个 Sakura 翻译器`);
  },
};

export default AddSakuraTranslator;
