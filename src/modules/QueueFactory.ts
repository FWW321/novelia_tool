import { ModuleDefinition } from '../types';
import StorageService from '../services/StorageService';
import { NotificationService } from '../store/notificationStore';
import { SettingId } from '../constants';
import { QueueUtils, NovelItem, TaskResult } from './QueueUtils';
import ApiService from '../services/ApiService';

interface QueueFactoryOptions {
  id: string;
  label: string;
  target: 'gpt' | 'sakura';
}

export const createQueueModule = (options: QueueFactoryOptions): ModuleDefinition => {
  return {
    id: options.id,
    label: options.label,
    type: 'onclick',
    whitelist: ['/wenku', '/novel', '/favorite'],
    settings: [
      { id: SettingId.WebCatchLimit, label: '单次获取web数量(可破限)', type: 'number', value: 20 },
      { id: SettingId.WenkuPageLimit, label: '获取单页wenku数量(deving)', type: 'number', value: 20 },
      { id: SettingId.Mode, label: '模式', type: 'select', value: '常规', options: ['常规', '过期', '重翻'] },
      { id: SettingId.SegmentMode, label: '分段', type: 'select', value: '智能', options: ['智能', '固定'] },
      { id: SettingId.SmartJobLimit, label: '智能均分任务上限', type: 'number', value: 1000 },
      { id: SettingId.SmartChapterLimit, label: '智能均分章节下限', type: 'number', value: 5 },
      { id: SettingId.FixedJobLimit, label: '固定均分任务', type: 'number', value: 6 },
      { id: SettingId.R18Bypass, label: 'R18(需登录)', type: 'boolean', value: true },
      { id: SettingId.Bind, label: 'bind', type: 'keybind', value: 'none' },
    ],
    run: async (cfg) => {
      const val = (id: string) => cfg.settings.find((s) => s.id === id)?.value;

      const webLimit = (val(SettingId.WebCatchLimit) as number) || 20;
      const mode = (val(SettingId.Mode) as string) || '常规';
      const splitMode = (val(SettingId.SegmentMode) as string) || '智能';
      const smartJobLimit = (val(SettingId.SmartJobLimit) as number) || 1000;
      const smartChapterLimit = (val(SettingId.SmartChapterLimit) as number) || 5;
      const staticParts = (val(SettingId.FixedJobLimit) as number) || 6;
      const r18Bypass = !!val(SettingId.R18Bypass);

      const type = QueueUtils.getTypeString(window.location.pathname);
      const translateMode = QueueUtils.getTranslateMode(mode);
      const storageKey = options.target === 'gpt' ? StorageService.gptKey : StorageService.sakuraKey;
      
      let results: TaskResult[] = [];

      try {
        if (type === 'wenkus') {
             const links = Array.from(document.querySelectorAll('a[href^="/wenku/"]'));
             const wenkuIds = Array.from(new Set(links.map(link => link.getAttribute('href')?.split('/wenku/')[1]).filter(x => x))) as string[];

             await Promise.all(wenkuIds.map(async (id) => {
                 try {
                     const data = await ApiService.fetchWenku(id, r18Bypass);
                     const volumeIds = data.volumeJp.map((v: any) => v.volumeId);
                     volumeIds.forEach((name: string) => {
                         results.push({
                             task: QueueUtils.wenkuLinkBuilder(id, name, translateMode),
                             description: name
                         });
                     });
                 } catch (e) {
                     console.error(`Failed to fetch wenku ${id}`, e);
                 }
             }));
        } else if (type === 'wenku') {
             const btns = Array.from(document.querySelectorAll('button'));
             const modeMap: Record<string, string> = { '常规': '常规', '过期': '过期', '重翻': '重翻' }; 
             const cnMode = modeMap[mode] || '常规';
             
             // Click buttons via DOM
             btns.find(b => b.textContent?.includes(cnMode))?.click();
             const targetBtn = options.target === 'gpt' ? '排队GPT' : '排队Sakura';
             btns.find(b => b.textContent?.includes(targetBtn))?.click();
             return; 

        } else if (type === 'novels') {
             const apiUrl = QueueUtils.webSearchApi(webLimit);
             const res = await ApiService.fetchWithAuth(`${window.location.origin}${apiUrl}`, r18Bypass);
             const data = await res.json();
             
             const novels: NovelItem[] = data.items.map((item: any) => ({
                 url: `/${item.providerId}/${item.novelId}`,
                 description: item.titleZh ?? item.titleJp,
                 total: item.total,
                 // Match legacy: use max of gpt and sakura as 'done' for normal mode skipping
                 done: Math.max(item.gpt || 0, item.sakura || 0)
             }));

             results = splitMode === '智能'
                ? await QueueUtils.assignTasksSmart(novels, smartJobLimit, smartChapterLimit, translateMode)
                : await QueueUtils.assignTasksStatic(novels, staticParts, translateMode);

        } else if (type === 'novel') {
             const targetSpan = Array.from(document.querySelectorAll('span.n-text')).find(span => /总计 (\d+) \/ 百度 (\d+) \/ 有道 (\d+) \/ GPT (\d+) \/ Sakura (\d+)/.test(span.textContent || ''));
             if (!targetSpan) throw new Error('Info span not found');
             
             const match = targetSpan.textContent?.match(/总计 (\d+) \/ 百度 (\d+) \/ 有道 (\d+) \/ GPT (\d+) \/ Sakura (\d+)/);
             if (!match) throw new Error('Regex match failed');

             const total = parseInt(match[1]);
             // Match legacy: use max of gpt and sakura
             const done = Math.max(parseInt(match[4]) || 0, parseInt(match[5]) || 0);
             const url = window.location.pathname.split('/novel')[1];
             const title = document.title;

             const novels: NovelItem[] = [{ url, description: title, total, done }];
             results = splitMode === '智能'
                ? await QueueUtils.assignTasksSmart(novels, smartJobLimit, smartChapterLimit, translateMode)
                : await QueueUtils.assignTasksStatic(novels, staticParts, translateMode);

        } else if (type === 'favorite-web') {
             const url = new URL(window.location.href);
             const pathParts = url.pathname.split('/').filter(p => p);
             const id = pathParts.length > 2 ? pathParts[2] : 'default';
             
             let page = 0;
             const allNovels: NovelItem[] = [];

             console.log(`[NoveliaTool] Start fetching web favorites, ID: ${id}`);

             while (true) {
                 const params = new URLSearchParams({
                     page: page.toString(),
                     pageSize: '30',
                     query: '',
                     provider: 'kakuyomu,syosetu,novelup,hameln,pixiv,alphapolis',
                     type: '0',
                     level: '0',
                     translate: '0',
                     sort: 'update'
                 });
                 const apiUrl = `${window.location.origin}/api/user/favored-web/${id}?${params.toString()}`;
                 
                 const res = await ApiService.fetchWithAuth(apiUrl, true);
                 if (!res.ok) break;
                 
                 const data = await res.json();
                 const items = data.items || [];
                 if (items.length === 0) break;

                 allNovels.push(...items.map((item: any) => {
                     const total = Number(item.total) || 0;
                     // Important: use max of all translators
                     const done = Math.max(Number(item.gpt) || 0, Number(item.sakura) || 0);
                     
                     return {
                        // Match legacy: web/provider/id
                        url: `/${item.providerId}/${item.novelId}`,
                        description: item.titleZh ?? item.titleJp,
                        total,
                        done
                     };
                 }));

                 if (items.length < 30) break;
                 page++;
             }

             console.log(`[NoveliaTool] Web novels fetched: ${allNovels.length}`);

             if (allNovels.length > 0) {
                 results = splitMode === '智能'
                    ? await QueueUtils.assignTasksSmart(allNovels, smartJobLimit, smartChapterLimit, translateMode)
                    : await QueueUtils.assignTasksStatic(allNovels, staticParts, translateMode);
                 
                 console.log(`[NoveliaTool] Web tasks assigned: ${results.length}`);
             }
        } else if (type === 'favorite-wenku') {
            const url = new URL(window.location.href);
            const pathParts = url.pathname.split('/').filter(p => p);
            const id = pathParts.length > 2 ? pathParts[2] : 'default';
            
            let page = 0;
            console.log(`[NoveliaTool] Start fetching wenku favorites, ID: ${id}`);

            while (true) {
                const params = new URLSearchParams({
                    page: page.toString(),
                    pageSize: '24',
                    sort: 'update'
                });
                const apiUrl = `${window.location.origin}/api/user/favored-wenku/${id}?${params.toString()}`;
                const res = await ApiService.fetchWithAuth(apiUrl, true);
                if (!res.ok) break;

                const data = await res.json();
                const items = data.items || [];
                if (items.length === 0) break;

                const wenkuIds = items.map((novel: any) => novel.id);
                await Promise.all(wenkuIds.map(async (wenkuId: string) => {
                    try {
                        const wenkuData = await ApiService.fetchWenku(wenkuId, true);
                        // Some wenku might only have volumeZh or volumeJp
                        const volumes = wenkuData.volumeJp || wenkuData.volumeZh || [];
                        const volumeIds = volumes.map((v: any) => v.volumeId);
                        
                        volumeIds.forEach((name: string) => {
                            results.push({
                                task: QueueUtils.wenkuLinkBuilder(wenkuId, name, translateMode),
                                description: name
                            });
                        });
                    } catch (e) {
                        console.error(`[NoveliaTool] Failed to fetch wenku ${wenkuId}`, e);
                    }
                }));

                if (items.length < 24) break;
                page++;
            }
            console.log(`[NoveliaTool] Wenku tasks assigned: ${results.length}`);
        } else {
             NotificationService.showWarning('不支持的页面类型');
             return;
        }

        if (results.length > 0) {
            await StorageService.addJobs(storageKey, results);
            NotificationService.showSuccess(`成功添加 ${results.length} 个任务`);
        } else {
            NotificationService.showWarning('未找到可添加的任务');
        }

      } catch (e) {
        console.error(e);
        NotificationService.showError('操作失败 (可能是网络错误或页面未加载完成)');
      }
    },
  };
};