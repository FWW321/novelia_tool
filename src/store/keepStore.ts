import { createStore } from 'solid-js/store';
import { defaultModules } from '../modules';

const STORAGE_KEY = 'ntr-toolbox-active-keeps';

// 从本地存储恢复状态
const getSavedActiveIds = (): string[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

interface KeepState {
  activeIds: string[];
}

export const [keepState, setKeepState] = createStore<KeepState>({
  activeIds: getSavedActiveIds(),
});

export const toggleKeepModule = (id: string) => {
  setKeepState('activeIds', (ids) => {
    const isRunning = ids.includes(id);
    const nextIds = isRunning ? ids.filter((i) => i !== id) : [...ids, id];
    // 持久化保存
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextIds));
    return nextIds;
  });
};

// 轮询执行器 (优化为更平滑的频率)
setInterval(() => {
  keepState.activeIds.forEach((id) => {
    const mod = defaultModules.find((m) => m.id === id);
    if (mod && mod.run) {
      try {
        mod.run(mod);
      } catch (e) {
        console.error(`[Module Runtime Error: ${id}]`, e);
      }
    }
  });
}, 1000); // 1秒一次，兼顾响应与性能