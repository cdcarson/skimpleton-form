import { browser } from '$app/environment';

export const bodyScrollLock = {
  lock: () => {
    if (!browser) {
      return;
    }
    document.body.classList.add('overflow-clip');
  },
  unlock: () => {
    if (!browser) {
      return;
    }
    document.body.classList.remove('overflow-clip');
  }
};
