import { ModuleDefinition } from '../types';
import { createPersistedStore } from '../utils/storeUtils';
import { STORAGE_KEYS } from '../constants';

export const CONFIG_VERSION = 20;

export interface Config {
  version: number;
  modules: ModuleDefinition[];
}

const initialState: Config = {
  version: CONFIG_VERSION,
  modules: [],
};

export const [config, setConfig, saveConfig] = createPersistedStore<Config>(
  initialState,
  { 
    key: STORAGE_KEYS.Config, 
    version: CONFIG_VERSION 
  }
);

export const getModuleConfig = (moduleId: string): ModuleDefinition | undefined => {
  return config.modules.find(m => m.id === moduleId);
};

export const updateModuleSetting = (moduleId: string, settingId: string, value: any) => {
  setConfig('modules', (m) => m.id === moduleId, 'settings', (s) => s.id === settingId, 'value', value);
};
