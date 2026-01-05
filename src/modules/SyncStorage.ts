import { ModuleDefinition } from '../types';
import { ModuleId, SettingId } from '../constants';

const SyncStorage: ModuleDefinition = {
  id: ModuleId.SyncStorage,
  label: '资料同步',
  type: 'onclick',
  whitelist: '/workspace/*',
  hidden: true,
  settings: [{ id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' }],
  run: async (cfg) => {
    // Empty implementation
  },
};

export default SyncStorage;
