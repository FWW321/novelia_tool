import { createStore } from 'solid-js/store';
import { defaultModules } from '../modules';
import { ModuleDefinition } from '../types';

const CONFIG_VERSION = 20;
const CONFIG_STORAGE_KEY = 'NTR_ToolBox_Config';

export interface Config {
  version: number;
  modules: ModuleDefinition[];
}

const [config, setConfig] = createStore<Config>({
  version: CONFIG_VERSION,
  modules: defaultModules, // Initial state, will be overwritten by load
});

const cloneDefaultModules = (): ModuleDefinition[] => {
  return defaultModules.map((m) => ({
    ...m,
    settings: m.settings ? m.settings.map((s) => ({ ...s })) : [],
  }));
};

export const loadConfiguration = () => {
  let stored: Config | null = null;
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (raw) stored = JSON.parse(raw);
  } catch (e) {}

  if (!stored || stored.version !== CONFIG_VERSION) {
    const fresh = cloneDefaultModules();
    setConfig({ version: CONFIG_VERSION, modules: fresh });
    saveConfiguration();
    return;
  }

  const loaded = cloneDefaultModules();
  stored.modules.forEach((storedMod) => {
    const defMod = loaded.find((m) => m.name === storedMod.name);
    if (defMod) {
      storedMod.settings.forEach((storedSetting) => {
        const defSetting = defMod.settings.find((s) => s.name === storedSetting.name);
        if (
          defSetting &&
          typeof defSetting.value === typeof storedSetting.value &&
          storedSetting.value !== undefined
        ) {
          defSetting.value = storedSetting.value;
        }
      });
    }
  });

  // Check structure integrity
  const defNames = defaultModules.map((x) => x.name).sort().join(',');
  const storedNames = loaded.map((x) => x.name).sort().join(',');

  if (defNames !== storedNames) {
    const fresh = cloneDefaultModules();
    setConfig({ version: CONFIG_VERSION, modules: fresh });
    saveConfiguration();
    return;
  }
  
  // Re-attach run functions (they are lost in JSON serialization, but 'loaded' is based on cloneDefaultModules which has them)
  // Actually cloneDefaultModules copies the object which has the 'run' function.
  // But we need to ensure the state in the store has them.
  // The 'loaded' array has them because it was created from 'defaultModules'.
  
  setConfig({ version: CONFIG_VERSION, modules: loaded });
};

export const saveConfiguration = () => {
  // We only save the data properties, not functions
  const dataToSave = {
    version: config.version,
    modules: config.modules.map(m => ({
      name: m.name,
      type: m.type,
      whitelist: m.whitelist,
      hidden: m.hidden,
      settings: m.settings
    }))
  };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(dataToSave));
};

export const updateModuleSetting = (moduleName: string, settingName: string, value: any) => {
  setConfig('modules', (m) => m.name === moduleName, 'settings', (s) => s.name === settingName, 'value', value);
  saveConfiguration();
};

export const getModuleConfig = (moduleName: string): ModuleDefinition | undefined => {
  return config.modules.find(m => m.name === moduleName);
};

export { config };
