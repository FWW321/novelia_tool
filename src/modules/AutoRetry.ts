import { ModuleDefinition } from '../types';
import TaskService from '../services/TaskService';
import { getModuleConfig } from '../store/configState';
import { ModuleId, SettingId } from '../constants';

let _attempts = 0;

const AutoRetry: ModuleDefinition = {
  id: ModuleId.AutoRetry,
  label: '自动重试',
  type: 'keep',
  whitelist: '/workspace/*',
  settings: [
    { id: SettingId.AutoRetryEnable, label: '自动重试', type: 'boolean', value: true },
    { id: SettingId.MaxAttempts, label: '最大尝试次数', type: 'number', value: 99 },
    { id: SettingId.MoveToTop, label: '置顶重试任务', type: 'boolean', value: false },
    { id: 'relaunch_enabled', label: '重启翻译器', type: 'boolean', value: true },
  ],
  run: async (cfg, _auto) => {
    const val = (id: string) => cfg.settings.find((s) => s.id === id)?.value;
    
    if (!val(SettingId.AutoRetryEnable)) return;

    const maxAttempts = val(SettingId.MaxAttempts) || 99;
    const moveToTop = val(SettingId.MoveToTop) || false;
    const relaunchEnabled = val('relaunch_enabled') ?? true;

    const { relaunch, checked } = await TaskService.checkAndAutoRetry(_attempts, maxAttempts, moveToTop);

    if (checked) {
      _attempts++;
      // Wait a bit after retry action
      await new Promise((r) => setTimeout(r, 100));
      
      if (relaunch && relaunchEnabled) {
        const launchConfig = getModuleConfig(ModuleId.LaunchTranslator);
        if (launchConfig && launchConfig.run) {
           await launchConfig.run(launchConfig, true);
        }
        _attempts = 0; // Reset after a full relaunch cycle
      }
    } else {
      _attempts = 0;
    }
  },
};

export default AutoRetry;
