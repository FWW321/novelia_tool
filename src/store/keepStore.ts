import { createPersistedStore } from '../utils/storeUtils';
import { STORAGE_KEYS } from '../constants';
import { config } from './configState';

const [keepActiveSet, setKeepActiveSet] = createPersistedStore<Record<string, boolean>>(
  {}, 
  { key: STORAGE_KEYS.KeepState }
);

export const toggleKeepModule = (moduleId: string) => {
  setKeepActiveSet(moduleId, (prev) => !prev);
};

export const isModuleActive = (moduleId: string) => !!keepActiveSet[moduleId];

let pollInterval: number | null = null;

const startPolling = () => {
  if (pollInterval) return;
  pollInterval = window.setInterval(() => {
    Object.keys(keepActiveSet).forEach((id) => {
      if (keepActiveSet[id]) {
        const mod = config.modules.find((m) => m.id === id);
        if (mod && mod.run) {
          mod.run(mod);
        }
      }
    });
  }, 100);
};

startPolling();

export { keepActiveSet };
