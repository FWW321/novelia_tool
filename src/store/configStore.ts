import { defaultModules } from '../modules';
import { ModuleDefinition } from '../types';
import { 
  config, 
  setConfig, 
  saveConfig,
  CONFIG_VERSION, 
  getModuleConfig,
  updateModuleSetting
} from './configState';

export { config, getModuleConfig, updateModuleSetting };

const cloneModules = (mods: ModuleDefinition[]): ModuleDefinition[] => {
  return mods.map((m) => ({
    ...m,
    settings: m.settings ? m.settings.map((s) => ({ ...s })) : [],
  }));
};

export const loadConfiguration = () => {
  const defaults = cloneModules(defaultModules);
  const stored = config.modules;

  if (stored.length === 0) {
    setConfig({ version: CONFIG_VERSION, modules: defaults });
    return;
  }

  const merged = defaults.map(defMod => {
    const storedMod = stored.find(s => s.id === defMod.id);
    if (!storedMod) return defMod;

    const mergedSettings = defMod.settings.map(defSet => {
      const storedSet = storedMod.settings?.find(s => s.id === defSet.id);
      if (storedSet && storedSet.value !== undefined) {
        return { ...defSet, value: storedSet.value };
      }
      return defSet;
    });

    return { ...defMod, settings: mergedSettings };
  });
  
  setConfig({ version: CONFIG_VERSION, modules: merged });
};

export const saveConfiguration = () => {
  saveConfig();
};
