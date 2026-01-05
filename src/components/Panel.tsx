import { Component, createSignal, onMount, Show } from 'solid-js';
import { position, setPosition, isMinimized, setIsMinimized, savePosition } from '../store/uiStore';
import ModuleList from './ModuleList';
import NotificationContainer from './NotificationContainer';
import styles from './Panel.module.css';

const Panel: Component = () => {
  let panelRef: HTMLDivElement | undefined;
  let titleRef: HTMLDivElement | undefined;

  const handleMouseDown = (e: MouseEvent) => {
    if (e.button !== 0 || !panelRef) return;
    
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = panelRef.getBoundingClientRect();
    const startLeft = rect.left;
    const startTop = rect.top;

    const handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      
      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Clamp
      const maxLeft = window.innerWidth - rect.width;
      const maxTop = window.innerHeight - rect.height;
      
      newLeft = Math.min(Math.max(newLeft, 0), maxLeft);
      newTop = Math.min(Math.max(newTop, 0), maxTop);

      panelRef!.style.left = `${newLeft}px`;
      panelRef!.style.top = `${newTop}px`;
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      if (panelRef) {
        savePosition(panelRef.style.left, panelRef.style.top);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMinimize = (e: MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized());
  };

  return (
    <>
      <div
        ref={panelRef}
        class={`${styles.panel} ${isMinimized() ? styles.minimized : ''}`}
        style={{ left: position().left, top: position().top }}
      >
        <div
          ref={titleRef}
          class={styles.titleBar}
          onMouseDown={handleMouseDown}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsMinimized(!isMinimized());
          }}
        >
          <span>NTR ToolBox v0.7</span>
          <span class={styles.toggleBtn} onClick={toggleMinimize}>
            {isMinimized() ? '[+]' : '[-]'}
          </span>
        </div>

        <div class={styles.body} style={{ display: isMinimized() ? 'none' : 'block' }}>
          <ModuleList />
          <div class={styles.footer}>
            <span>左键执行/切换 | 右键设定</span>
            <span>Author: TheNano</span>
          </div>
        </div>
      </div>
      <NotificationContainer />
    </>
  );
};

export default Panel;
