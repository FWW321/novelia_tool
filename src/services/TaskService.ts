export type TranslateMode = 'normal' | 'expire' | 'all';
export type PageType = 'wenkus' | 'wenku' | 'novels' | 'novel' | 'favorite-web' | 'favorite-wenku' | 'favorite-local';

interface NovelItem {
  url: string;
  description: string;
  total: number;
  sakura?: number;
  gpt?: number;
}

export interface TaskResult {
  task: string;
  description: string;
}

class TaskService {
  static getTypeString(url: string): PageType | null {
    const patterns: Record<PageType, RegExp> = {
      'wenkus': /^\/wenku(\?.*)?$/,
      'wenku': /^\/wenku\/.*(\?.*)?$/,
      'novels': /^\/novel(\?.*)?$/,
      'novel': /^\/novel\/.*(\?.*)?$/,
      'favorite-web': /^\/favorite\/web(\/.*)?(\?.*)?$/,
      'favorite-wenku': /^\/favorite\/wenku(\/.*)?(\?.*)?$/,
      'favorite-local': /^\/favorite\/local(\/.*)?(\?.*)?$/
    };

    for (const [key, pattern] of Object.entries(patterns)) {
      if (pattern.test(url)) {
        return key as PageType;
      }
    }
    return null;
  }

  static wenkuLinkBuilder(series: string, name: string, mode: string): string {
    return `wenku/${series}/${name}?level=${mode}&forceMetadata=false&startIndex=0&endIndex=65536`;
  }

  static webLinkBuilder(url: string, from: number = 0, to: number = 65536, mode: string): string {
    return `web${url}?level=${mode}&forceMetadata=false&startIndex=${from}&endIndex=${to}`;
  }

  static wenkuIds(): string[] {
    const links = Array.from(document.querySelectorAll('a[href^="/wenku/"]')) as HTMLAnchorElement[];
    return links.map(link => {
      const href = link.getAttribute('href');
      return href ? href.split('/wenku/')[1] : '';
    }).filter(id => id);
  }

  static webSearchApi(limit: number = 20): string {
    const urlParams = new URLSearchParams(location.search);
    const pageParam = urlParams.get('page');
    const page = Math.max((pageParam ? parseInt(pageParam) - 1 : 0), 0);
    
    const input = document.querySelector('input[placeholder="中/日文标题或作者"]') as HTMLInputElement;
    const rawQuery = input ? input.value.trim() : '';
    const query = encodeURIComponent(rawQuery);

    const selected = Array.from(document.querySelectorAll('.n-text.__text-dark-131ezvy-p')).map(e => e.textContent?.trim() || '');

    const sourceMap: Record<string, string> = {
      'Kakuyomu': 'kakuyomu',
      '成为小说家吧': 'syosetu',
      'Novelup': 'novelup',
      'Hameln': 'hameln',
      'Pixiv': 'pixiv',
      'Alphapolis': 'alphapolis'
    };
    const typeMap: Record<string, string> = { '连载中': '1', '已完结': '2', '短篇': '3', '全部': '0' };
    const levelMap: Record<string, string> = { '一般向': '1', 'R18': '2', '全部': '0' };
    const translateMap: Record<string, string> = { 'GPT': '1', 'Sakura': '2', '全部': '0' };
    const sortMap: Record<string, string> = { '更新': '0', '点击': '1', '相关': '2' };

    const providers = Object.keys(sourceMap)
      .filter(k => selected.includes(k))
      .map(k => sourceMap[k])
      .join(',') || 'kakuyomu,syosetu,novelup,hameln,pixiv,alphapolis';

    const tKey = Object.keys(typeMap).find(x => selected.includes(x)) || '全部';
    const lKey = Object.keys(levelMap).find(x => selected.includes(x)) || '全部';
    const trKey = Object.keys(translateMap).find(x => selected.includes(x)) || '全部';
    const sKey = Object.keys(sortMap).find(x => selected.includes(x)) || '更新';

    return `/api/novel?page=${page}&pageSize=${limit}&query=${query}` +
      `&provider=${encodeURIComponent(providers)}&type=${typeMap[tKey]}&level=${levelMap[lKey]}` +
      `&translate=${translateMap[trKey]}&sort=${sortMap[sKey]}`;
  }

  static async assignTasksSmart(
    novels: NovelItem[],
    smartJobLimit: number,
    smartChapterLimit: number,
    mode: string
  ): Promise<TaskResult[]> {
    const undone = (n: NovelItem) => {
      if (mode === "normal") {
        const sOrG = (n.sakura ?? n.gpt) || 0;
        return Math.max(n.total - sOrG, 0);
      }
      return n.total;
    };

    const totalChapters = novels.reduce((acc, n) => acc + undone(n), 0);
    const potentialMaxTask = Math.floor(totalChapters / smartChapterLimit);
    let maxTasks = Math.min(potentialMaxTask, smartJobLimit);

    if (maxTasks <= 0 && totalChapters > 0) {
      maxTasks = smartJobLimit;
    }
    if (totalChapters === 0) {
      return [];
    }
    const chunkSize = Math.ceil(totalChapters / (maxTasks || 1));
    const sorted = [...novels].sort((a, b) => undone(b) - undone(a));

    const result: TaskResult[] = [];
    let usedTasks = 0;

    for (const novel of sorted) {
      let remain = undone(novel);
      if (remain <= 0) continue;

      let startIndex = (mode === "normal") ? (novel.total - remain) : 0;

      while (remain > 0 && usedTasks < smartJobLimit) {
        const thisChunk = Math.min(remain, chunkSize);
        const endIndex = startIndex + thisChunk;

        result.push({
          task: TaskService.webLinkBuilder(novel.url, startIndex, endIndex, mode),
          description: novel.description
        });

        usedTasks++;
        remain -= thisChunk;
        startIndex = endIndex;
        if (usedTasks >= smartJobLimit) {
          break;
        }
      }
      if (usedTasks >= smartJobLimit) {
        break;
      }
    }

    return result;
  }

  static async assignTasksStatic(novels: NovelItem[], parts: number, mode: string): Promise<TaskResult[]> {
    const undone = (n: NovelItem) => {
      if (mode === "normal") {
        const sOrG = (n.sakura ?? n.gpt) || 0;
        return n.total - sOrG;
      }
      return n.total;
    };

    const result: TaskResult[] = [];

    for (const novel of novels) {
      const totalChapters = undone(novel);
      if (totalChapters <= 0) continue;
      const startBase = (mode === "normal")
        ? (novel.total - totalChapters)
        : 0;

      const chunkSize = Math.ceil(totalChapters / parts);

      for (let i = 0; i < parts; i++) {
        const chunkStart = startBase + i * chunkSize;
        const chunkEnd = (i === parts - 1)
          ? (startBase + totalChapters)
          : (chunkStart + chunkSize);

        if (chunkStart < startBase + totalChapters) {
          result.push({
            task: TaskService.webLinkBuilder(novel.url, chunkStart, chunkEnd, mode),
            description: novel.description
          });
        }
      }
    }
    return result;
  }

  static async clickTaskMoveToTop(count: number, reserve: boolean = true): Promise<void> {
    const extras = document.querySelectorAll('.n-thing-header__extra');
    for (let i = 0; i < count; i++) {
      const offset = reserve ? extras.length - i - 1 : i;
      const container = extras[offset];
      if (!container) continue;
      const buttons = container.querySelectorAll('button');
      if (buttons.length) {
        (buttons[0] as HTMLElement).click();
      }
    }
  }

  static async clickButtons(name: string = ''): Promise<void> {
    const btns = document.querySelectorAll('button');
    btns.forEach(btn => {
      if (name === '' || btn.textContent?.includes(name)) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
  }
}

export default TaskService;
