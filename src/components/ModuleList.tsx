import { Component, For, createSignal, onMount, onCleanup } from 'solid-js';
import { config } from '../store/configStore';
import ModuleItem from './ModuleItem';
import styles from './ModuleList.module.css';

const ModuleList: Component = () => {
  const [currentPath, setCurrentPath] = createSignal(window.location.pathname);

  onMount(() => {
    const handleUrlChange = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handleUrlChange);
    
    const interval = setInterval(() => {
      if (window.location.pathname !== currentPath()) {
        handleUrlChange();
      }
    }, 500);

    onCleanup(() => {
      window.removeEventListener('popstate', handleUrlChange);
      clearInterval(interval);
    });
  });

  const isAllowed = (whitelist: string | string[]) => {
    const path = currentPath();
    const list = Array.isArray(whitelist) ? whitelist : [whitelist];
    return list.some((p) => {
      if (p.endsWith('/*')) {
        const base = p.slice(0, -2);
        return path.startsWith(base) || path === base;
      }
      return path.includes(p);
    });
  };

  const visibleModules = () => {
    if (window.location.hostname !== 'n.novelia.cc') return [];
    return config.modules.filter((mod) => isAllowed(mod.whitelist));
  };

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
