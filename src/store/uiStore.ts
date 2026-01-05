import { createSignal } from 'solid-js';

const initialPos = (() => {
  try {
    const saved = localStorage.getItem('ntr-panel-position');
    if (saved) return JSON.parse(saved);
  } catch (e) {}
  return { left: '20px', top: '70px' };
})();

export const [position, setPosition] = createSignal(initialPos);
export const [isMinimized, setIsMinimized] = createSignal(false);

export const savePosition = (left: string, top: string) => {
  setPosition({ left, top });
  localStorage.setItem('ntr-panel-position', JSON.stringify({ left, top }));
};
