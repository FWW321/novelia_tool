export type TaskResult = {
  task: string;
  description: string;
};

export type NovelItem = {
  url: string;
  description: string;
  total: number;
  done: number; // sakura or gpt count
};

export class QueueUtils {
  // --- Link Builders ---

  static wenkuLinkBuilder(series: string, name: string, mode: string) {
    return `wenku/${series}/${name}?level=${mode}&forceMetadata=false&startIndex=0&endIndex=65536`;
  }

  static webLinkBuilder(url: string, from: number, to: number, mode: string) {
    return `web${url}?level=${mode}&forceMetadata=false&startIndex=${from}&endIndex=${to}`;
  }

  static getTranslateMode(mode: string): string {
    const map: Record<string, string> = { '常规': 'normal', '过期': 'expire', '重翻': 'all' };
    return map[mode] || 'normal';
  }

  // --- Core Algorithms ---

  /**
   * Smart assignment: Prioritizes novels with the most unfinished chapters.
   * Splits tasks into chunks to maximize parallel processing.
   */
  static async assignTasksSmart(
    novels: NovelItem[],
    smartJobLimit: number,
    smartChapterLimit: number,
    mode: string
  ): Promise<TaskResult[]> {
    const undone = (n: NovelItem) => {
      if (mode === 'normal') {
        // Match legacy behavior: skip if either Sakura or GPT has finished it
        // Note: n.done here should ideally be the max of all available translations
        return Math.max(n.total - n.done, 0);
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

      let startIndex = (mode === 'normal') ? (novel.total - remain) : 0;

      while (remain > 0 && usedTasks < smartJobLimit) {
        const thisChunk = Math.min(remain, chunkSize);
        const endIndex = startIndex + thisChunk;

        result.push({
          task: this.webLinkBuilder(novel.url, startIndex, endIndex, mode),
          description: novel.description,
        });

        usedTasks++;
        remain -= thisChunk;
        startIndex = endIndex;

        if (usedTasks >= smartJobLimit) break;
      }
      if (usedTasks >= smartJobLimit) break;
    }

    return result;
  }

  /**
   * Static assignment: Splits each novel into a fixed number of tasks.
   */
  static async assignTasksStatic(
    novels: NovelItem[],
    parts: number,
    mode: string
  ): Promise<TaskResult[]> {
    const undone = (n: NovelItem) => {
      if (mode === 'normal') {
        return Math.max(n.total - n.done, 0);
      }
      return n.total;
    };

    const result: TaskResult[] = [];

    for (const novel of novels) {
      const totalChapters = undone(novel);
      if (totalChapters <= 0) continue;

      const startBase = (mode === 'normal') ? (novel.total - totalChapters) : 0;
      const chunkSize = Math.ceil(totalChapters / parts);

      for (let i = 0; i < parts; i++) {
        const chunkStart = startBase + i * chunkSize;
        const chunkEnd = (i === parts - 1) 
          ? (startBase + totalChapters) 
          : (chunkStart + chunkSize);

        if (chunkStart < startBase + totalChapters) {
          result.push({
            task: this.webLinkBuilder(novel.url, chunkStart, chunkEnd, mode),
            description: novel.description,
          });
        }
      }
    }
    return result;
  }

  // --- Page Type Detection ---

  static getTypeString(url: string): string | null {
    const patterns: Record<string, RegExp> = {
        'wenkus': /^\/wenku(\?.*)?$/, 
        'wenku': /^\/wenku\/.*(\?.*)?$/,
        'novels': /^\/novel(\?.*)?$/,
        'novel': /^\/novel\/.*(\?.*)?$/,
        'favorite-web': /^\/favorite\/web(\/.*)?(\?.*)?$/,
        'favorite-wenku': /^\/favorite\/wenku(\/.*)?(\?.*)?$/,
        'favorite-local': /^\/favorite\/local(\/.*)?(\?.*)?$/
    };
    for (const [key, pattern] of Object.entries(patterns)) {
        if (pattern.test(url)) return key;
    }
    return null;
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
}
