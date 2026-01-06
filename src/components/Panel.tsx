import { Component, createSignal, Show } from 'solid-js';
import styles from './Panel.module.css';
import ModuleList from './ModuleList';
import { ui, setUi } from '../store/uiStore';

const Panel: Component = () => {
  let panelRef: HTMLDivElement | undefined;
  const [isDragging, setIsDragging] = createSignal(false);
  
  const handleMouseDown = (e: MouseEvent) => {
    // 只有点击 header 且不是点击关闭按钮时才触发拖拽
    if ((e.target as HTMLElement).closest(`.${styles.header}`) && !(e.target as HTMLElement).closest(`.${styles.closeBtn}`)) {
      setIsDragging(true);
      const startX = e.clientX - ui.pos.x;
      const startY = e.clientY - ui.pos.y;

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging()) return;
        
        requestAnimationFrame(() => {
          let nextX = moveEvent.clientX - startX;
          let nextY = moveEvent.clientY - startY;

          // 边界吸附逻辑 (20px 边距)
          const margin = 20;
          nextX = Math.max(margin, Math.min(window.innerWidth - 300 - margin, nextX));
          nextY = Math.max(margin, Math.min(window.innerHeight - Math.min(500, window.innerHeight - 40) - margin, nextY));

          setUi('pos', { x: nextX, y: nextY });
        });
      };

      const onMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    }
  };

  return (
    <Show when={ui.visible}>
      <div
        ref={panelRef}
        class={styles.panel}
        style={{
          left: `${ui.pos.x}px`,
          top: `${ui.pos.y}px`,
          transition: isDragging() ? 'none' : 'transform 0.2s ease, opacity 0.2s ease',
        }}
        onMouseDown={handleMouseDown}
      >
        <div class={styles.header}>
          <div class={styles.titleGroup}>
            <svg class={styles.panelIcon} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)" fill="currentColor">
                <path d="M1438 4566 c-65 -34 -120 -64 -123 -67 -2 -3 96 -199 219 -435 l224
                -429 -614 -3 -614 -2 0 -400 0 -400 -185 0 -185 0 0 -750 0 -750 185 0 185 0
                0 -400 0 -400 2030 0 2030 0 0 400 0 400 185 0 185 0 0 750 0 750 -185 0 -185
                0 -2 398 -3 397 -614 3 c-534 2 -612 4 -607 17 3 8 104 204 225 435 l219 420
                -124 64 -124 63 -19 -31 c-10 -17 -128 -241 -261 -499 l-243 -467 -481 2 -481
                3 -245 470 c-135 259 -252 482 -260 497 l-15 27 -117 -63z m349 -1669 c203
                -106 213 -388 18 -498 -187 -105 -416 29 -414 241 1 118 50 199 150 249 59 30
                70 32 139 29 43 -3 89 -12 107 -21z m1789 -5 c98 -50 162 -169 151 -279 -23
                -224 -292 -330 -461 -182 -62 55 -88 108 -94 192 -8 119 44 213 150 267 58 29
                69 31 138 27 50 -2 89 -11 116 -25z m-126 -1372 l0 -280 -890 0 -890 0 0 280
                0 280 890 0 890 0 0 -280z"></path>
              </g>
            </svg>
            <span class={styles.title}>Novelia Tool</span>
          </div>
          <button class={styles.closeBtn} onClick={() => setUi('visible', false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class={`${styles.content} ntr-scrollbar`}>
          <ModuleList />
        </div>
        
        <div class={styles.footer}>
          v{import.meta.env.VITE_APP_VERSION || '2.0.0'} • Zinc Edition
        </div>
      </div>
    </Show>
  );
};

export default Panel;
