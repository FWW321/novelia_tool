import type { Component } from 'solid-js';
import { onMount, onCleanup } from 'solid-js';
import Panel from './components/Panel';
import { loadConfiguration, config } from './store/configStore';
import { loadKeepState } from './store/keepStore';
import StorageService from './services/StorageService';

const App: Component = () => {
  onMount(() => {
    loadConfiguration();
    loadKeepState();

    // Global Keybindings
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const pk = e.key.toLowerCase();
      
      // We can iterate config.modules directly
      config.modules.forEach((mod) => {
        const bindSetting = mod.settings?.find((s) => s.name === 'bind');
        if (!bindSetting || bindSetting.value === 'none') return;
        
        if ((bindSetting.value as string).toLowerCase() === pk) {
             // Check whitelist
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
             
             // Check domain
             const h = window.location.hostname;
             const domainAllowed = h === 'books.fishhawk.top' || h === 'books1.fishhawk.top' || h === 'n.novelia.cc';

             if (domainAllowed && isAllowed(mod.whitelist)) {
                e.preventDefault();
                // Trigger run or toggle keep
                 if (mod.type === 'onclick' && mod.run) {
                    mod.run(mod);
                 } else if (mod.type === 'keep') {
                     // We need to toggle it. 
                     // Since toggleKeepModule is in keepStore, we import it dynamically or just import it at top
                     import('./store/keepStore').then(({ toggleKeepModule }) => {
                         toggleKeepModule(mod.name);
                     });
                 }
             }
        }
      });
    };

    document.addEventListener('keydown', handleKeyDown);

    // URL Polling and Storage Update
    let lastEndPoint = window.location.href;
    const intervalId = window.setInterval(() => {
       if (lastEndPoint !== window.location.href) {
           StorageService.update();
           lastEndPoint = window.location.href;
       }
    }, 250);

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyDown);
      window.clearInterval(intervalId);
    });
  });

  return (
    <Panel />
  );
};

export default App;