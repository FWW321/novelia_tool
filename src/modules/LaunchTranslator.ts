import { ModuleDefinition } from '../types';
import { NotificationService } from '../store/notificationStore';

const LaunchTranslator: ModuleDefinition = {
  name: '启动翻译器',
  type: 'onclick',
  whitelist: '/workspace',
  settings: [
    { name: '延迟间隔', type: 'number', value: 50 },
    { name: '最多启动', type: 'number', value: 999 },
    { name: '避免无效启动', type: 'boolean', value: true },
    { name: '排除', type: 'string', value: '本机,AutoDL' },
    { name: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg, auto) => {
    const intervalVal = cfg.settings.find((s) => s.name === '延迟间隔')?.value || 50;
    const maxClick = cfg.settings.find((s) => s.name === '最多启动')?.value || 999;
    const noEmptyLaunch = cfg.settings.find((s) => s.name === '避免无效启动')?.value;

    const allBtns = Array.from(document.querySelectorAll('button')).filter((btn) => {
      if (!auto && noEmptyLaunch) return true;
      const listItem = btn.closest('.n-list-item');
      if (listItem) {
        const errorMessages = listItem.querySelectorAll('div');
        return !Array.from(errorMessages).some((div) =>
          div.textContent?.includes('TypeError: Failed to fetch')
        );
      }
      return true;
    });

    const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
    let idx = 0,
      clickCount = 0,
      lastRunning = 0,
      emptyCheck = 0;

    async function nextClick() {
      while (idx < allBtns.length && clickCount < maxClick) {
        const btn = allBtns[idx++];
        if (btn.textContent?.includes('启动')) {
          btn.click();
          clickCount++;
          await delay(intervalVal);
        }
        if (noEmptyLaunch) {
          let running = Array.from(document.querySelectorAll('button')).filter((btn) =>
            btn.textContent?.includes('停止')
          ).length;
          if (running == lastRunning) emptyCheck++;
          if (emptyCheck > 3) break;
        }
      }
    }
    await nextClick();
    if (clickCount > 0) {
      NotificationService.showSuccess(`成功启动 ${clickCount} 个翻译器`);
    } else {
      NotificationService.showWarning('未找到可启动的翻译器');
    }
  },
};

export default LaunchTranslator;
