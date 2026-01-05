import { ModuleDefinition } from '../types';
import { ModuleId, SettingId } from '../constants';

const LaunchTranslator: ModuleDefinition = {
  id: ModuleId.LaunchTranslator,
  label: '启动翻译器',
  type: 'onclick',
  whitelist: '/workspace',
  settings: [
    { id: 'interval', label: '延迟间隔', type: 'number', value: 50 },
    { id: 'max_launch', label: '最多启动', type: 'number', value: 999 },
    { id: 'avoid_empty', label: '避免无效启动', type: 'boolean', value: true },
    { id: SettingId.Exclude, label: '排除', type: 'string', value: '本机,AutoDL' },
    { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' },
  ],
    run: async (cfg, auto) => {
      const val = (id: string) => cfg.settings.find((s) => s.id === id)?.value;
      
      const intervalVal = (cfg.settings.find(s => s.label === '延迟间隔')?.value as number) || 50;
      const maxClick = (val('max_launch') as number) || 999;
      const noEmptyLaunch = val('avoid_empty');
      const excludeStr = (val(SettingId.Exclude) as string) || '';
      const excludeArr = excludeStr.split(',').filter(x => x);
  
      const getRunningCount = () => Array.from(document.querySelectorAll('button')).filter(btn => btn.textContent?.includes('停止')).length;
  
      const allBtns = Array.from(document.querySelectorAll('button')).filter(btn => {
        // Basic whitelist check for button context
        const listItem = btn.closest('.n-list-item');
        if (!listItem) return false;
  
        // Exclude check
        const text = listItem.textContent || '';
        if (excludeArr.some(ex => text.includes(ex))) return false;
  
        // If auto-retrying, we might want to avoid "broken" workers
        if (noEmptyLaunch) {
          const hasError = listItem.textContent?.includes('TypeError: Failed to fetch');
          if (hasError) return false;
        }
  
        return btn.textContent?.includes('启动');
      });
  
      const delay = (ms: number) => new Promise(r => setTimeout(r, ms));
      
      let idx = 0;
      let clickCount = 0;
      let lastRunning = getRunningCount();
      let emptyCheck = 0;
  
      while (idx < allBtns.length && clickCount < maxClick) {
        const btn = allBtns[idx++];
        btn.click();
        clickCount++;
        
        await delay(intervalVal);
  
        if (noEmptyLaunch) {
          const currentRunning = getRunningCount();
          if (currentRunning === lastRunning) {
            emptyCheck++;
          } else {
            emptyCheck = 0;
            lastRunning = currentRunning;
          }
          
          if (emptyCheck > 3) break;
        }
      }
    },
  };

export default LaunchTranslator;
