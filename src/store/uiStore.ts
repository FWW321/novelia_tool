import { createStore } from 'solid-js/store';

interface UIState {
  visible: boolean;
  currentPath: string;
  pos: {
    x: number;
    y: number;
  };
}

const STORAGE_KEY = 'ntr-toolbox-ui-state';

const loadState = (): UIState => {
  const defaultState: UIState = {
    visible: true,
    currentPath: window.location.pathname,
    pos: { x: 20, y: 70 }
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 简单验证解析结果
      if (typeof parsed.pos?.x === 'number' && typeof parsed.pos?.y === 'number') {
        return { ...defaultState, ...parsed };
      }
    }
  } catch (e) {
    console.warn('Failed to load UI state', e);
  }
  return defaultState;
};

const [ui, setUiInternal] = createStore<UIState>(loadState());

// 封装 setUi 以便自动保存
export const setUi: typeof setUiInternal = (...args: any[]) => {
  // @ts-ignore
  setUiInternal(...args);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ui));
};

export { ui };