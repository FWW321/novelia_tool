import { Component, For } from 'solid-js';
import { useNotifications } from '../store/notificationStore';
import styles from './NotificationContainer.module.css';

const NotificationContainer: Component = () => {
  const notifications = useNotifications();

  return (
    <div class={styles.container}>
      <For each={notifications}>
        {(item) => (
          <div class={`${styles.message} ${styles[item.type]}`}>
            <span class={styles.icon}>
              {item.type === 'success' && '✅'}
              {item.type === 'warning' && '⚠️'}
              {item.type === 'error' && '❌'}
            </span>
            {item.message}
          </div>
        )}
      </For>
    </div>
  );
};

export default NotificationContainer;
