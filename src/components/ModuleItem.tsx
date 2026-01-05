import { Component, createSignal, For, Show } from 'solid-js';
import { ModuleDefinition } from '../types';
import { isModuleActive, toggleKeepModule } from '../store/keepStore';
import styles from './ModuleItem.module.css';
import SettingField from './SettingField';

interface Props {
  module: ModuleDefinition;
}

const ModuleItem: Component<Props> = (props) => {
  const [showSettings, setShowSettings] = createSignal(false);

  const handleClick = (e: MouseEvent) => {
    // Check if clicked on settings or setting field
    if ((e.target as HTMLElement).closest(`.${styles.settings}`)) return;

    if (e.button === 0 && !e.ctrlKey && !e.altKey && !e.shiftKey) {
      if (props.module.type === 'onclick') {
        if (props.module.run) {
          props.module.run(props.module);
        }
      } else if (props.module.type === 'keep') {
        toggleKeepModule(props.module.name);
      }
    }
  };

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    setShowSettings(!showSettings());
  };

  const isActive = () => props.module.type === 'keep' && isModuleActive(props.module.name);

  return (
    <div class={styles.container}>
      <div
        class={`${styles.header} ${isActive() ? styles.active : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        <span>{props.module.name}</span>
        <span class={styles.icon}>
          {props.module.type === 'keep' ? '⇋' : '▶'}
        </span>
      </div>
      <Show when={showSettings()}>
        <div class={styles.settings}>
          <For each={props.module.settings}>
            {(setting) => (
              <SettingField moduleName={props.module.name} setting={setting} />
            )}
          </For>
        </div>
      </Show>
    </div>
  );
};

export default ModuleItem;
