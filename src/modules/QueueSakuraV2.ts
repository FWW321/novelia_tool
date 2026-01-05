import { ModuleDefinition } from '../types';
import TaskService, { TaskResult } from '../services/TaskService';
import StorageService from '../services/StorageService';
import ApiService from '../services/ApiService';
import { NotificationService } from '../store/notificationStore';

const getTranslateMode = (mode: string) => {
  const map: Record<string, string> = { '常规': 'normal', '过期': 'expire', '重翻': 'all' };
  return map[mode] || 'normal';
};

const QueueSakuraV2: ModuleDefinition = {
  name: '排队Sakura v2',
  type: 'onclick',
  whitelist: ['/wenku', '/novel', '/favorite'],
  settings: [
    { name: '单次获取web数量(可破限)', type: 'number', value: 20 },
    { name: '获取单页wenku数量(deving)', type: 'number', value: 20 },
    { name: '模式', type: 'select', value: '常规', options: ['常规', '过期', '重翻'] },
    { name: '分段', type: 'select', value: '智能', options: ['智能', '固定'] },
    { name: '智能均分任务上限', type: 'number', value: 1000 },
    { name: '智能均分章节下限', type: 'number', value: 5 },
    { name: '固定均分任务', type: 'number', value: 6 },
    { name: 'R18(需登录)', type: 'boolean', value: true },
    { name: 'bind', type: 'keybind', value: 'none' },
  ],
  run: async (cfg) => {
    const webCatchLimit = cfg.settings.find((s) => s.name === '单次获取web数量(可破限)')?.value || 20;
    // const wenkuCatchLimit = cfg.settings.find(s => s.name === '擷取單頁wenku數量(deving)')?.value || 20;
    const pair = cfg.settings.find((s) => s.name === '固定均分任务')?.value || 6;
    const smartJobLimit = cfg.settings.find((s) => s.name === '智能均分任务上限')?.value || 1000;
    const smartChapterLimit = cfg.settings.find((s) => s.name === '智能均分章节下限')?.value || 5;
    const type = TaskService.getTypeString(window.location.pathname);
    const mode = cfg.settings.find((s) => s.name === '模式')?.value || '常规';
    const sepMode = cfg.settings.find((s) => s.name === '分段')?.value || '智能';
    const r18Bypass = cfg.settings.find((s) => s.name === 'R18(需登录)')?.value;

    let results: TaskResult[] = [];
    let errorFlag = false;
    const maxRetries = 3;

    const modeMap: Record<string, string> = { '常规': '常规', '过期': '过期', '重翻': '重翻' };
    const cnMode = modeMap[mode] || '常规';

    if (!type) return;

    switch (type) {
      case 'wenkus': {
        const wenkuIds = TaskService.wenkuIds();
        const apiEndpoint = `/api/wenku/`;

        await Promise.all(
          wenkuIds.map(async (id) => {
            let attempts = 0;
            let success = false;

            while (attempts < maxRetries && !success) {
              try {
                const response = await ApiService.fetch(
                  `${window.location.origin}${apiEndpoint}${id}`,
                  r18Bypass
                );
                if (!response.ok) throw new Error('Network response was not ok');
                const data = await response.json();
                const volumeIds = data.volumeJp.map((volume: any) => volume.volumeId);

                volumeIds.forEach((name: string) =>
                  results.push({
                    task: TaskService.wenkuLinkBuilder(id, name, getTranslateMode(mode)),
                    description: name,
                  })
                );
                success = true;
              } catch (error) {
                NotificationService.showError(
                  `Failed to fetch data for ID ${id}, attempt ${attempts + 1}.`
                );
                attempts++;
                if (attempts < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, 1000));
                }
              }
            }
          })
        );
        await StorageService.addJobs(StorageService.sakuraKey, results);
        break;
      }
      case 'wenku': {
        await TaskService.clickButtons(cnMode);
        await TaskService.clickButtons('排队Sakura');
        break;
      }
      case 'novels': {
        const apiUrl = TaskService.webSearchApi(webCatchLimit);
        try {
          const response = await ApiService.fetch(
            `${window.location.origin}${apiUrl}`,
            r18Bypass
          );
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          const novels = data.items.map((item: any) => {
            const title = item.titleZh ?? item.titleJp;
            return {
              url: `/${item.providerId}/${item.novelId}`,
              description: title,
              total: item.total,
              sakura: item.sakura,
            };
          });
          results =
            sepMode == '智能'
              ? await TaskService.assignTasksSmart(
                  novels,
                  smartJobLimit,
                  smartChapterLimit,
                  getTranslateMode(mode)
                )
              : await TaskService.assignTasksStatic(novels, pair, getTranslateMode(mode));

          await StorageService.addJobs(StorageService.sakuraKey, results);
        } catch (error) {
          errorFlag = true;
          NotificationService.showError('Failed to fetch data.');
        }
        break;
      }
      case 'novel': {
        try {
          const targetSpan = Array.from(document.querySelectorAll('span.n-text')).find((span) =>
            /总计 (\d+) \/ 百度 (\d+) \/ 有道 (\d+) \/ GPT (\d+) \/ Sakura (\d+)/.test(
              span.textContent || ''
            )
          );
          if (!targetSpan || !targetSpan.textContent) throw Error('Info span not found');
          
          const match = targetSpan.textContent.match(
            /总计 (\d+) \/ 百度 (\d+) \/ 有道 (\d+) \/ GPT (\d+) \/ Sakura (\d+)/
          );
          if (!match) throw Error('Info match failed');

          const total = parseInt(match[1]);
          const sakura = parseInt(match[5]);
          
          const url = window.location.pathname.split('/novel')[1];
          const title = document.title;
          if (title.includes('轻小说机翻机器人')) throw Error('小说页尚未加载');

          const novels = [{ url: url, total: total, sakura: sakura, description: title }];
          results =
            sepMode == '智能'
              ? await TaskService.assignTasksSmart(
                  novels,
                  smartJobLimit,
                  smartChapterLimit,
                  getTranslateMode(mode)
                )
              : await TaskService.assignTasksStatic(novels, pair, getTranslateMode(mode));

          await StorageService.addJobs(StorageService.sakuraKey, results);
        } catch (error) {
          errorFlag = true;
          NotificationService.showError(`Failed to fetch data for current novel.`);
        }
        break;
      }
      case 'favorite-web': {
        const url = new URL(window.location.href);
        const id = url.pathname.endsWith('/web') ? 'default' : url.pathname.split('/').pop();
        let tries = 0;
        let page = 0;

        while (true) {
          const apiUrl = `${url.origin}/api/user/favored-web/${id}?page=${page}&pageSize=90&sort=update`;
          let tasks: TaskResult[] = [];
          let novelCount = 0;
          try {
            const response = await ApiService.fetch(apiUrl);
            const data = await response.json();
            const novels = data.items.map((item: any) => {
              const title = item.titleZh ?? item.titleJp;
              return {
                url: `/${item.providerId}/${item.novelId}`,
                description: title,
                total: item.total,
                sakura: item.sakura,
              };
            });
            novelCount = novels.length;
            tasks =
              sepMode == '智能'
                ? await TaskService.assignTasksSmart(
                    novels,
                    smartJobLimit,
                    smartChapterLimit,
                    getTranslateMode(mode)
                  )
                : await TaskService.assignTasksStatic(novels, pair, getTranslateMode(mode));

            await StorageService.addJobs(StorageService.sakuraKey, tasks);
            results.push(...tasks);
            NotificationService.showSuccess(
              `成功排队 ${3 * page + 1}-${3 * page + 3}页, 共${tasks.length}个任务`
            );
          } catch (error) {
            console.log(error);
            NotificationService.showError(`Failed to fetch data for ${id}, page ${page + 1}.`);
            if (tries++ > 3) break;
            continue;
          }
          if (novelCount < 90) break;
          else page++;
        }
        break;
      }
      case 'favorite-wenku': {
        const url = new URL(window.location.href);
        const id = url.pathname.endsWith('/wenku') ? 'default' : url.pathname.split('/').pop();
        let page = 0;
        let tries = 0;
        while (true) {
          const apiUrl = `${url.origin}/api/user/favored-wenku/${id}?page=${page}&pageSize=72&sort=update`;
          let tasks: TaskResult[] = [];
          let novelCount = 0;
          try {
            const response = await ApiService.fetch(apiUrl);
            const data = await response.json();
            const wenkuIds = data.items.map((novel: any) => novel.id);
            novelCount = wenkuIds.length;

            await Promise.all(
              wenkuIds.map(async (id: string) => {
                let attempts = 0;
                let success = false;
                const apiEndpoint = `/api/wenku/`;

                while (attempts < maxRetries && !success) {
                  try {
                    const response = await ApiService.fetch(
                      `${window.location.origin}${apiEndpoint}${id}`,
                      r18Bypass
                    );
                    if (!response.ok) throw new Error('Network response was not ok');
                    const data = await response.json();
                    const volumeIds = data.volumeJp.map((volume: any) => volume.volumeId);

                    volumeIds.forEach((name: string) =>
                      tasks.push({
                        task: TaskService.wenkuLinkBuilder(id, name, mode),
                        description: name,
                      })
                    );
                    success = true;
                  } catch (error) {
                    NotificationService.showError(
                      `Failed to fetch data for ID ${id}, attempt ${attempts + 1}:`
                    );
                    attempts++;
                    if (attempts < maxRetries) {
                      await new Promise((resolve) => setTimeout(resolve, 1000));
                    }
                  }
                }
              })
            );
            await StorageService.addJobs(StorageService.sakuraKey, tasks);
            results.push(...tasks);
            NotificationService.showSuccess(
              `成功排队 ${3 * page + 1}-${3 * page + 3}页, 共${tasks.length}本小说`
            );
          } catch (error) {
            console.log(error);
            NotificationService.showError(`Failed to fetch data for ${id}, page ${page + 1}.`);
            if (tries > 3) break;
            continue;
          }
          if (novelCount < 72) break;
          else page++;
        }
        break;
      }
      default: {
      }
    }
    if (errorFlag) return;
    const novels = new Set(results.map((result) => result.description));
    NotificationService.showSuccess(
      `排队成功 : 共 ${novels.size} 本小说, 均分 ${results.length} 分段.`
    );
  },
};

export default QueueSakuraV2;
