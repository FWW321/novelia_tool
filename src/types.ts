export type SettingType = 'boolean' | 'number' | 'string' | 'select' | 'keybind';

export interface ModuleSetting {
  name: string;
  type: SettingType;
  value: any;
  options?: string[]; // For select type
}

export interface ModuleDefinition {
  name: string;
  type: 'onclick' | 'keep';
  whitelist: string | string[];
  hidden?: boolean;
  settings: ModuleSetting[];
  run: (config: ModuleDefinition, auto?: boolean) => Promise<void> | void;
}

export interface WorkerData {
  id: string | number;
  name?: string;
  endpoint: string;
  prevSegLength?: number;
  segLength?: number;
  type?: 'api';
  model?: string;
  key?: string;
}

export interface JobData {
  task: string;
  description: string;
  createAt: number;
}

export interface StorageData {
  workers: WorkerData[];
  jobs: JobData[];
  uncompletedJobs: any[];
}
