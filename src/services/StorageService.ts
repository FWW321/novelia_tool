import { StorageData, WorkerData, JobData } from '../types';

class StorageService {
  public static get sakuraKey(): string {
    return 'workspace-sakura';
  }

  public static get gptKey(): string {
    return 'workspace-gpt';
  }

  public static async update(): Promise<void> {
    const storageKey = window.location.pathname.includes('workspace/sakura')
      ? this.sakuraKey
      : window.location.pathname.includes('workspace/gpt')
      ? this.gptKey
      : null;

    if (!storageKey) return;

    const data = await this._getData(storageKey);
    await this._setData(storageKey, data);
  }

  private static async _setData(key: string, data: StorageData): Promise<void> {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: key,
        newValue: JSON.stringify(data),
        url: window.location.href,
        storageArea: localStorage,
      })
    );
  }

  private static async _getData(key: string): Promise<StorageData> {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
    return { workers: [], jobs: [], uncompletedJobs: [] };
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

    // Find the current maximum ID to ensure uniqueness
    const maxId = data.workers.reduce((max, w) => {
      const wId = typeof w.id === 'number' ? w.id : parseInt(w.id as string) || 0;
      return wId > max ? wId : max;
    }, 0);

    const _dataInsert = (
      wId: number,
      wName: string,
      wEndpoint: string,
      wPrevSegLength: number,
      wSegLength: number
    ) => {
      const worker: WorkerData = {
        id: wId,
        name: wName,
        endpoint: wEndpoint,
        prevSegLength: wPrevSegLength,
        segLength: wSegLength,
      };
      // Always push as new because we generated a unique ID
      data.workers.push(worker);
    };

    if (total === 1) {
      _dataInsert(maxId + 1, namePrefix, endpoint, prevSegLength, segLength);
    } else {
      for (let i = 1; i <= total; i++) {
        _dataInsert(maxId + i, `${namePrefix} ${i}`, endpoint, prevSegLength, segLength);
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

    // Find the current maximum ID to ensure uniqueness
    const maxId = data.workers.reduce((max, w) => {
      const wId = typeof w.id === 'number' ? w.id : parseInt(w.id as string) || 0;
      return wId > max ? wId : max;
    }, 0);

    const _dataInsert = (
      wId: number,
      wName: string,
      wModel: string,
      wEndpoint: string,
      wKey: string
    ) => {
      const worker: WorkerData = {
        id: wId,
        name: wName,
        type: 'api',
        model: wModel,
        endpoint: wEndpoint,
        key: wKey,
      };
      // Always push as new because we generated a unique ID
      data.workers.push(worker);
    };

    if (total === 1) {
      _dataInsert(maxId + 1, namePrefix, model, endpoint, key);
    } else {
      for (let i = 1; i <= total; i++) {
        _dataInsert(maxId + i, `${namePrefix} ${i}`, model, endpoint, key);
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
