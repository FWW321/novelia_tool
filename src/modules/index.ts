import AddSakuraTranslator from './AddSakuraTranslator';
import AddGPTTranslator from './AddGPTTranslator';
import DeleteTranslator from './DeleteTranslator';
import LaunchTranslator from './LaunchTranslator';
import QueueSakuraV2 from './QueueSakuraV2';
import QueueGPTV2 from './QueueGPTV2';
import AutoRetry from './AutoRetry';
import SyncStorage from './SyncStorage';
import ClearQueue from './ClearQueue';
import { ModuleDefinition } from '../types';

export const defaultModules: ModuleDefinition[] = [
  AddSakuraTranslator,
  AddGPTTranslator,
  DeleteTranslator,
  ClearQueue,
  LaunchTranslator,
  QueueSakuraV2,
  QueueGPTV2,
  AutoRetry,
  SyncStorage,
];
