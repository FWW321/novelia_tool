import { ModuleDefinition } from '../types';
import TaskService from '../services/TaskService';
import LaunchTranslator from './LaunchTranslator';

let _attempts = 0;
let _lastRun = 0;
const _interval = 1000;
let _boundClickHandler: ((e: MouseEvent) => void) | null = null;

const AutoRetry: ModuleDefinition = {
  name: '自动重试',
  type: 'keep',
  whitelist: '/workspace/*',
  settings: [
    { name: '最大重试次数', type: 'number', value: 99 },
    { name: '置顶重试任务', type: 'boolean', value: false },
    { name: '重启翻译器', type: 'boolean', value: true },
  ],
  run: async (cfg) => {
    const now = Date.now();
    if (now - _lastRun < _interval) return;
    _lastRun = now;

    const maxAttempts = cfg.settings.find((s) => s.name === '最大重试次数')?.value || 99;
    const relaunch = cfg.settings.find((s) => s.name === '重启翻译器')?.value ?? true;
    const moveToTop = cfg.settings.find((s) => s.name === '置顶重试任务')?.value;

    if (!_boundClickHandler) {
      _boundClickHandler = (e: MouseEvent) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') {
          _attempts = 0;
        }
      };
      document.addEventListener('click', _boundClickHandler);
    }

    const listItems = document.querySelectorAll('.n-list-item');
    const unfinished = Array.from(listItems).filter((item) => {
      const desc = item.querySelector('.n-thing-main__description');
      return desc && desc.textContent?.includes('未完成');
    });

    async function retryTasks(attempts: number) {
      const hasStop = Array.from(document.querySelectorAll('button')).some(
        (b) => b.textContent === '停止'
      );
      if (!hasStop) {
        const retryBtns = Array.from(document.querySelectorAll('button')).filter((b) =>
          b.textContent?.includes('重试未完成任务')
        );
        if (retryBtns[0]) {
          const clickCount = Math.min(unfinished.length, listItems.length);
          for (let i = 0; i < clickCount; i++) {
            (retryBtns[0] as HTMLElement).click();
          }
          if (moveToTop) {
            TaskService.clickTaskMoveToTop(unfinished.length);
          }
          attempts++;
        }
      }
      return attempts;
    }

    if (unfinished.length > 0 && _attempts < maxAttempts) {
      _attempts = await retryTasks(_attempts);
      await new Promise((r) => setTimeout(r, 10));
      if (relaunch) {
        // Dynamically import configStore to avoid circular dependency
        const { getModuleConfig } = await import('../store/configStore');
        const launchConfig = getModuleConfig('启动翻译器');
        if (launchConfig && launchConfig.run) {
           await launchConfig.run(launchConfig, true);
        }
      }
    }
  },
};

export default AutoRetry;
