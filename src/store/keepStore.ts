import { createStore } from 'solid-js/store';
import { config } from './configStore';

const KEEP_STATE_KEY = 'NTR_KeepState';

const [keepActiveSet, setKeepActiveSet] = createStore<Record<string, boolean>>({});

export const loadKeepState = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(KEEP_STATE_KEY) || '{}');
    setKeepActiveSet(saved);
  } catch (e) {}
  startPolling();
};

export const toggleKeepModule = (moduleName: string) => {
  setKeepActiveSet(moduleName, (prev) => !prev);
  const newState = { ...keepActiveSet };
  localStorage.setItem(KEEP_STATE_KEY, JSON.stringify(newState));
};

export const isModuleActive = (moduleName: string) => !!keepActiveSet[moduleName];

let pollInterval: number | null = null;

const startPolling = () => {
  if (pollInterval) return;
  pollInterval = window.setInterval(() => {
    Object.keys(keepActiveSet).forEach((name) => {
      if (keepActiveSet[name]) {
        const mod = config.modules.find((m) => m.name === name);
        if (mod && mod.run) {
          // We pass the current config from the store
          mod.run(mod);
        }
      }
    });
  }, 100);
};
