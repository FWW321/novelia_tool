class TaskService {
  static async clickTaskMoveToTop(count: number, reserve: boolean = true): Promise<void> {
    const extras = document.querySelectorAll('.n-thing-header__extra');
    for (let i = 0; i < count; i++) {
      const offset = reserve ? extras.length - i - 1 : i;
      const container = extras[offset];
      if (!container) continue;
      const buttons = container.querySelectorAll('button');
      if (buttons.length) {
        (buttons[0] as HTMLElement).click();
      }
    }
  }

  static async clickButtons(name: string = ''): Promise<void> {
    const btns = document.querySelectorAll('button');
    btns.forEach(btn => {
      if (name === '' || btn.textContent?.includes(name)) {
        btn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
  }

  static async checkAndAutoRetry(
    attempts: number, 
    maxAttempts: number,
    moveToTop: boolean = false
  ): Promise<{ relaunch: boolean; checked: boolean }> {
    const listItems = Array.from(document.querySelectorAll('.n-list-item'));
    const unfinished = listItems.filter(item => item.textContent?.includes('未完成'));
    
    if (unfinished.length === 0) {
        return { relaunch: false, checked: false };
    }

    if (attempts >= maxAttempts) {
        return { relaunch: true, checked: true };
    }

    const hasStop = Array.from(document.querySelectorAll('button')).some(b => b.textContent?.includes('停止'));
    if (hasStop) {
        return { relaunch: false, checked: false };
    }

    const retryBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('重试未完成任务'));
    
    if (retryBtn) {
        const clickCount = Math.min(unfinished.length, listItems.length);
        for (let i = 0; i < clickCount; i++) {
            (retryBtn as HTMLElement).click();
        }

        if (moveToTop) {
            await this.clickTaskMoveToTop(unfinished.length);
        }
        
        return { relaunch: false, checked: true };
    }

    return { relaunch: false, checked: false };
  }
}

export default TaskService;