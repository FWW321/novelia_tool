import { Component, For, createSignal, onMount, Show, onCleanup } from 'solid-js';
import { config } from '../store/configStore';
import ModuleItem from './ModuleItem';

const ModuleList: Component = () => {
  const [currentPath, setCurrentPath] = createSignal(window.location.pathname);

  onMount(() => {
    // Poll for URL changes since history API doesn't always trigger events in SPA
    const interval = setInterval(() => {
        if (window.location.pathname !== currentPath()) {
            setCurrentPath(window.location.pathname);
        }
    }, 200);

    onCleanup(() => clearInterval(interval));
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

  const domainAllowed = () => {
     const h = window.location.hostname;
     return h === 'n.novelia.cc';
  }

  return (
    <div>
      <For each={config.modules}>
        {(mod) => (
          <Show when={domainAllowed() && !mod.hidden && isAllowed(mod.whitelist)}>
            <ModuleItem module={mod} />
          </Show>
        )}
      </For>
    </div>
  );
};

export default ModuleList;
