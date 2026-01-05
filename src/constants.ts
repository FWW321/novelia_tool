export enum ModuleId {
  AutoRetry = 'auto_retry',
  AddGPTTranslator = 'add_gpt_translator',
  AddSakuraTranslator = 'add_sakura_translator',
  QueueGPT = 'queue_gpt_v2',
  QueueSakura = 'queue_sakura_v2',
  LaunchTranslator = 'launch_translator',
  ClearQueue = 'clear_queue',
  DeleteTranslator = 'delete_translator',
  SyncStorage = 'sync_storage',
}

export enum SettingId {
  Bind = 'bind',
  // AutoRetry specific
  AutoRetryEnable = 'auto_retry_enable',
  MaxAttempts = 'max_attempts',
  MoveToTop = 'move_to_top',
  // Queue settings
  WebCatchLimit = 'web_catch_limit',
  WenkuPageLimit = 'wenku_page_limit',
  Mode = 'mode',
  SegmentMode = 'segment_mode',
  SmartJobLimit = 'smart_job_limit',
  SmartChapterLimit = 'smart_chapter_limit',
  FixedJobLimit = 'fixed_job_limit',
  R18Bypass = 'r18_bypass',
  // Translator settings
  Count = 'count',
  NamePrefix = 'name_prefix',
  Model = 'model',
  Endpoint = 'endpoint',
  ApiKey = 'api_key',
  Exclude = 'exclude',
}

export const STORAGE_KEYS = {
  Config: 'NTR_ToolBox_Config',
  KeepState: 'NTR_KeepState',
};