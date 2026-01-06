import type { Component } from 'solid-js';
import { onMount, onCleanup } from 'solid-js';
import Panel from './components/Panel';
import NotificationContainer from './components/NotificationContainer';
import FloatingTrigger from './components/FloatingTrigger';
import { loadConfiguration, config } from './store/configStore';
import { toggleKeepModule } from './store/keepStore';
import { setUi } from './store/uiStore';
import StorageService from './services/StorageService';

import { SettingId } from './constants';

const App: Component = () => {
  onMount(() => {
    loadConfiguration();
    
    // Global Keybindings
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle UI visibility with Alt + T
      if (e.altKey && e.key.toLowerCase() === 't') {
        setUi('visible', v => !v);
        return;
      }

      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (window.location.hostname !== 'n.novelia.cc' && window.location.hostname !== 'n.sakura-share.one') return;

      const pk = e.key.toLowerCase();
      
      const isAllowed = (whitelist: string | string[]) => {
        const path = window.location.pathname;
        const list = Array.isArray(whitelist) ? whitelist : [whitelist];
        return list.some((p) => {
          if (p.endsWith('/*')) {
            const base = p.slice(0, -2);
            return path.startsWith(base) || path === base;
          }
          return path.includes(p);
        });
      };

      config.modules.forEach((mod) => {
        const bindSetting = mod.settings?.find((s) => s.id === SettingId.Bind);
        if (!bindSetting || bindSetting.value === 'none') return;
        
        if ((bindSetting.value as string).toLowerCase() === pk) {
             if (isAllowed(mod.whitelist)) {
                e.preventDefault();
                // Trigger run or toggle keep
                 if (mod.type === 'onclick' && mod.run) {
                    mod.run(mod);
                 } else if (mod.type === 'keep') {
                     toggleKeepModule(mod.id);
                 }
             }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    // URL Change Detection (Event-driven)
    const handleUrlChange = () => {
      setUi('currentPath', window.location.pathname);
      StorageService.update();
    };

    // 1. Listen for browser navigation (back/forward)
    window.addEventListener('popstate', handleUrlChange);

    // 2. Monkey-patch pushState and replaceState for SPA navigation
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      handleUrlChange();
      return result;
    };

    history.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      handleUrlChange();
      return result;
    };

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handleUrlChange);
      // Restore original history methods
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
    });
  });

  return (
    <>
      <Panel />
      <FloatingTrigger />
      <NotificationContainer />
    </>
  );
};

export default App;