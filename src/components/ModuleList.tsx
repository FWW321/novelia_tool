import { Component, For, createMemo } from 'solid-js';
import { config } from '../store/configStore';
import { ui } from '../store/uiStore';
import ModuleItem from './ModuleItem';
import styles from './ModuleList.module.css';

const ModuleList: Component = () => {
  const isAllowed = (path: string, whitelist: string | string[]) => {
    const list = Array.isArray(whitelist) ? whitelist : [whitelist];
    return list.some((p) => {
      if (p.endsWith('/*')) {
        const base = p.slice(0, -2);
        return path.startsWith(base) || path === base;
      }
      return path.includes(p);
    });
  };

  const visibleModules = createMemo(() => {
    if (window.location.hostname !== 'n.novelia.cc' && window.location.hostname !== 'n.sakura-share.one') return [];
    const path = ui.currentPath;
    return config.modules.filter((mod) => isAllowed(path, mod.whitelist));
  });

  return (
    <div class={styles.list}>
      <For each={visibleModules()}>
        {(module, index) => (
          <div 
            class={styles.itemWrapper} 
            style={{ "animation-delay": `${index() * 0.05}s` }}
          >
            <ModuleItem module={module} />
          </div>
        )}
      </For>
    </div>
  );
};

export default ModuleList;
