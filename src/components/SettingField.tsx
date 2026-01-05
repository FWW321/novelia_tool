import { Component, createSignal, Show, Switch, Match, For } from 'solid-js';
import { ModuleSetting } from '../types';
import { updateModuleSetting } from '../store/configStore';
import styles from './SettingField.module.css';

interface Props {
  moduleName: string;
  setting: ModuleSetting;
}

const SettingField: Component<Props> = (props) => {
  const [isBinding, setIsBinding] = createSignal(false);

  const handleKeyBind = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.key === 'Escape') {
      updateModuleSetting(props.moduleName, props.setting.name, 'none');
    } else {
      updateModuleSetting(props.moduleName, props.setting.name, e.key.toLowerCase());
    }
    setIsBinding(false);
    document.removeEventListener('keydown', handleKeyBind, true);
  };

  const startBinding = () => {
    setIsBinding(true);
    document.addEventListener('keydown', handleKeyBind, true);
  };

  return (
    <div class={styles.row}>
      <label class={styles.label}>{props.setting.name}: </label>
      <Switch fallback={<span style={{ color: '#999' }}>{String(props.setting.value)}</span>}>
        <Match when={props.setting.type === 'boolean'}>
          <input
            type="checkbox"
            checked={!!props.setting.value}
            onChange={(e) => updateModuleSetting(props.moduleName, props.setting.name, e.currentTarget.checked)}
          />
        </Match>
        <Match when={props.setting.type === 'number'}>
          <input
            type="number"
            class={styles.numberInput}
            value={props.setting.value}
            onChange={(e) => updateModuleSetting(props.moduleName, props.setting.name, Number(e.currentTarget.value) || 0)}
          />
        </Match>
        <Match when={props.setting.type === 'string'}>
           <input
             type="text"
             class={styles.textInput}
             value={props.setting.value}
             onChange={(e) => updateModuleSetting(props.moduleName, props.setting.name, e.currentTarget.value)}
           />
        </Match>
        <Match when={props.setting.type === 'select'}>
          <select
            class={styles.select}
            value={props.setting.value}
            onChange={(e) => updateModuleSetting(props.moduleName, props.setting.name, e.currentTarget.value)}
          >
            <For each={props.setting.options}>
              {(opt) => <option value={opt}>{opt}</option>}
            </For>
          </select>
        </Match>
        <Match when={props.setting.type === 'keybind'}>
          <button class={styles.bindButton} onClick={startBinding}>
            {isBinding() ? '(Press any key)' : props.setting.value === 'none' ? '(None)' : `[${props.setting.value.toUpperCase()}]`}
          </button>
        </Match>
      </Switch>
    </div>
  );
};

export default SettingField;
