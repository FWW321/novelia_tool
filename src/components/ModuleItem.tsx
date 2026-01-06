import { Component, createSignal, Show, For } from 'solid-js';
import { ModuleDefinition } from '../types';
import { keepState, toggleKeepModule } from '../store/keepStore';
import { updateModuleSetting } from '../store/configStore';
import styles from './ModuleItem.module.css';
import SettingField from './SettingField';

interface Props {
  module: ModuleDefinition;
}

const ModuleItem: Component<Props> = (props) => {
  const [expanded, setExpanded] = createSignal(false);
  
  const isRunning = () => {
    return props.module.type === 'keep' && keepState.activeIds.includes(props.module.id);
  };

  const handleToggle = (e: Event) => {
    e.stopPropagation();
    toggleKeepModule(props.module.id);
  };

  const handleRun = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.module.run) {
      props.module.run(props.module);
    }
  };

  const hasSettings = () => {
    return props.module.settings && props.module.settings.length > 0;
  };

  const onUpdateSetting = (settingId: string, value: any) => {
    updateModuleSetting(props.module.id, settingId, value);
  };

  return (
    <div 
      class={styles.card} 
      classList={{ 
        [styles.active]: expanded(),
        [styles.running]: isRunning()
      }}
    >
      <div class={styles.mainRow}>
        <div class={styles.info} onClick={() => setExpanded(!expanded())}>
          <div class={styles.nameGroup}>
            <span class={styles.name}>{props.module.label}</span>
            <Show when={isRunning()}>
              <span class={styles.pulseDot} title="Running in background" />
            </Show>
          </div>
          <span class={styles.typeTag}>{props.module.type}</span>
        </div>

        <div class={styles.actions}>
          <Show when={hasSettings()}>
            <button 
              class={styles.iconBtn} 
              classList={{ [styles.expanded]: expanded() }}
              onClick={(e) => { e.stopPropagation(); setExpanded(!expanded()); }}
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          </Show>

          <Show when={props.module.type === 'keep'}>
            <label class={styles.switch} onClick={e => e.stopPropagation()}>
              <input type="checkbox" checked={isRunning()} onChange={handleToggle} />
              <span class={styles.slider} />
            </label>
          </Show>
          
          <Show when={props.module.type === 'onclick'}>
            <button class={styles.runBtn} onClick={handleRun}>Run</button>
          </Show>
        </div>
      </div>

      <div class={styles.settingsGrid} classList={{ [styles.isOpen]: expanded() }}>
        <div class={styles.settingsContent}>
          <div class={styles.settingsInner}>
            <For each={props.module.settings}>
              {(setting) => (
                <SettingField 
                  setting={setting} 
                  onUpdate={(val) => onUpdateSetting(setting.id, val)}
                />
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleItem;