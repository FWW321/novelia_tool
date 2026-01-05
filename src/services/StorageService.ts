import { StorageData, WorkerData, JobData } from '../types';

class StorageService {
  public static get sakuraKey(): string {
    return 'workspace-sakura';
  }

  public static get gptKey(): string {
    return 'workspace-gpt';
  }

  private static _cache: Map<string, StorageData> = new Map();

  static {
    if (typeof window !== 'undefined') {
        // Listen for storage changes from other tabs to keep cache in sync
        window.addEventListener('storage', (event) => {
        if (event.key && (event.key === this.sakuraKey || event.key === this.gptKey)) {
            if (event.newValue) {
            try {
                this._cache.set(event.key, JSON.parse(event.newValue));
            } catch (e) {
                console.error('Failed to sync storage cache', e);
            }
            } else {
            this._cache.delete(event.key);
            }
        }
        });
    }
  }

  public static async update(): Promise<void> {
    const storageKey = window.location.pathname.includes('workspace/sakura')
      ? this.sakuraKey
      : window.location.pathname.includes('workspace/gpt')
      ? this.gptKey
      : null;

    if (!storageKey) return;

    await this._getData(storageKey);

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(this._cache.get(storageKey)),
        url: window.location.href,
        storageArea: localStorage,
      })
    );
  }

  private static async _setData(key: string, data: StorageData): Promise<void> {
    this._cache.set(key, data);
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: key,
        newValue: json,
        url: window.location.href,
        storageArea: localStorage,
      })
    );
  }

  private static async _getData(key: string): Promise<StorageData> {
    if (this._cache.has(key)) {
      return this._cache.get(key)!;
    }

    const raw = localStorage.getItem(key);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        this._cache.set(key, data);
        return data;
      } catch (e) {
        console.error('Failed to parse storage data', e);
      }
    }
    const defaultData: StorageData = { workers: [], jobs: [], uncompletedJobs: [] };
    this._cache.set(key, defaultData);
    return defaultData;
  }

  public static async addSakuraWorker(
    namePrefix: string,
    endpoint: string,
    amount: number | null = null,
    prevSegLength: number = 500,
    segLength: number = 500
  ): Promise<void> {
    const total = amount ?? 1;
    let data = await this._getData(this.sakuraKey);

    const _dataInsert = (id: string | number) => {
      const worker: WorkerData = {
        id,
        endpoint,
        prevSegLength,
        segLength,
      };
      const idx = data.workers.findIndex((w) => w.id === id);
      if (idx !== -1) data.workers[idx] = worker;
      else data.workers.push(worker);
    };

    if (total <= 1) {
      _dataInsert(namePrefix);
    } else {
      for (let i = 1; i <= total; i++) {
        _dataInsert(`${namePrefix}${i}`);
      }
    }
    await this._setData(this.sakuraKey, data);
  }

  public static async addGPTWorker(
    namePrefix: string,
    model: string,
    endpoint: string,
    key: string,
    amount: number | null = null
  ): Promise<void> {
    const total = amount ?? 1;
    let data = await this._getData(this.gptKey);

    const _dataInsert = (id: string | number) => {
      const worker: WorkerData = {
        id,
        type: 'api',
        model,
        endpoint,
        key,
      };
      const idx = data.workers.findIndex((w) => w.id === id);
      if (idx !== -1) data.workers[idx] = worker;
      else data.workers.push(worker);
    };

    if (total <= 1) {
      _dataInsert(namePrefix);
    } else {
      for (let i = 1; i <= total; i++) {
        _dataInsert(`${namePrefix}${i}`);
      }
    }
    await this._setData(this.gptKey, data);
  }

  public static async removeWorker(key: string, id: string | number): Promise<void> {
    let data = await this._getData(key);
    data.workers = data.workers.filter((w) => w.id !== id);
    await this._setData(key, data);
  }

  public static async removeAllWorkers(key: string, exclude: (string | number)[] = []): Promise<void> {
    let data = await this._getData(key);
    data.workers = data.workers.filter((w) => exclude.includes(w.id));
    await this._setData(key, data);
  }

  public static async removeAllJobs(key: string): Promise<void> {
    let data = await this._getData(key);
    data.jobs = [];
    await this._setData(key, data);
  }

  public static async addJob(
    key: string,
    task: string,
    description: string,
    createAt: number = Date.now()
  ): Promise<void> {
    const job: JobData = { task, description, createAt };
    let data = await this._getData(key);
    data.jobs.push(job);
    await this._setData(key, data);
  }

  public static async addJobs(
    key: string,
    jobs: { task: string; description: string }[],
    createAt: number = Date.now()
  ): Promise<void> {
    let data = await this._getData(key);
    const existingTasks = new Set(data.jobs.map((job) => job.task));
    jobs.forEach(({ task, description }) => {
      if (!existingTasks.has(task)) {
        const job: JobData = { task, description, createAt };
        data.jobs.push(job);
      }
    });
    await this._setData(key, data);
  }

  public static async getUncompletedJobs(key: string): Promise<any[]> {
    return (await this._getData(key)).uncompletedJobs;
  }
}

export default StorageService;
