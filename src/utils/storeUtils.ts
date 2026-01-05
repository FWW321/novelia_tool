import { createStore, Store, SetStoreFunction } from 'solid-js/store';

export interface PersistenceOptions<T> {
  key: string;
  version?: number;
  migrations?: Record<number, (data: any) => T>;
}

/**
 * Creates a SolidJS store that automatically loads from and saves to localStorage.
 * @param initialState The default state if no storage exists.
 * @param options Configuration for persistence (key, versioning).
 * @returns [store, setStore, save] - save is exposed for manual triggering if needed, though setters wrap it.
 */
export function createPersistedStore<T extends object>(
  initialState: T,
  options: PersistenceOptions<T>
): [Store<T>, SetStoreFunction<T>, () => void] {
  let startState = initialState;
  try {
    const raw = localStorage.getItem(options.key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (options.version && parsed.version !== options.version) {
        if (options.migrations && options.migrations[parsed.version]) {
           startState = options.migrations[parsed.version](parsed);
        } else {
           console.warn(`Version mismatch for ${options.key}. Resetting.`);
           startState = initialState;
        }
      } else {
        startState = parsed;
      }
    }
  } catch (e) {
    console.error(`Failed to load store ${options.key}`, e);
  }

  // 2. Create Store
  const [store, internalSetStore] = createStore<T>(startState);

  // 3. Save Function
  const save = () => {
    try {
      localStorage.setItem(options.key, JSON.stringify(store));
    } catch (e) {
      console.error(`Failed to save store ${options.key}`, e);
    }
  };
  
  const setStore: SetStoreFunction<T> = (...args: any[]) => {
    (internalSetStore as any)(...args);
    save();
  };

  return [store, setStore, save];
}
