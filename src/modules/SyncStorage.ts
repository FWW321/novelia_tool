import { ModuleDefinition } from '../types';

const SyncStorage: ModuleDefinition = {
  name: '资料同步',
  type: 'onclick',
  whitelist: '/workspace/*',
  hidden: true,
  settings: [{ name: 'bind', type: 'keybind', value: 'none' }],
  run: async (cfg) => {
    // Empty implementation
  },
};

export default SyncStorage;
