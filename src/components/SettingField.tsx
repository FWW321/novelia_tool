import { Component, createSignal, onCleanup, Show } from 'solid-js';
import { ModuleSetting } from '../types';
import styles from './SettingField.module.css';

interface Props {
  setting: ModuleSetting;
  onUpdate: (value: any) => void;
}

const SettingField: Component<Props> = (props) => {
  const [isRecording, setIsRecording] = createSignal(false);

  const startRecording = () => {
    setIsRecording(true);
    window.addEventListener('keydown', handleKeyCapture, true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    window.removeEventListener('keydown', handleKeyCapture, true);
  };

  const handleKeyCapture = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 如果按下 Esc，则清除绑定 (设为 none)
    if (e.key === 'Escape') {
      props.onUpdate('none');
      stopRecording();
      return;
    }
    
    // 忽略单纯的修饰键
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
    
    const key = e.key.toLowerCase();
    props.onUpdate(key);
    stopRecording();
  };

  onCleanup(() => {
    window.removeEventListener('keydown', handleKeyCapture, true);
  });

  return (
    <div class={styles.field}>
      <label class={styles.label}>{props.setting.label}</label>
      
      <div class={styles.control}>
        {/* Boolean Type */}
        {props.setting.type === 'boolean' && (
          <label class={styles.switch}>
            <input 
              type="checkbox" 
              checked={props.setting.value as boolean}
              onChange={(e) => props.onUpdate(e.currentTarget.checked)}
            />
            <span class={styles.slider}></span>
          </label>
        )}

        {/* Select Type */}
        {props.setting.type === 'select' && (
          <select 
            class={styles.select}
            value={props.setting.value as string}
            onChange={(e) => props.onUpdate(e.currentTarget.value)}
          >
            {props.setting.options?.map(opt => {
              const label = typeof opt === 'string' ? opt : (opt as any).label;
              const value = typeof opt === 'string' ? opt : (opt as any).value;
              return <option value={value}>{label}</option>;
            })}
          </select>
        )}

        {/* Keybind Type */}
        {props.setting.type === 'keybind' && (
          <button 
            class={styles.bindBtn} 
            classList={{ [styles.recording]: isRecording() }}
            onClick={() => isRecording() ? stopRecording() : startRecording()}
          >
            {isRecording() ? 'Press any key...' : (props.setting.value === 'none' ? 'Click to bind' : `Key: ${(props.setting.value as string).toUpperCase()}`)}
          </button>
        )}

        {/* String & Number Type */}
        {(props.setting.type === 'string' || props.setting.type === 'number') && (
          <input 
            type={props.setting.type === 'string' ? 'text' : 'number'}
            class={styles.input}
            value={props.setting.value as string | number}
            onInput={(e) => props.onUpdate(props.setting.type === 'number' ? Number(e.currentTarget.value) : e.currentTarget.value)}
          />
        )}
      </div>
    </div>
  );
};

export default SettingField;
