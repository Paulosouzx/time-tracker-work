type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    notify();
  });
}

export function canInstall() {
  return deferred !== null;
}

export function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

export function onInstallAvailabilityChange(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export async function promptInstall() {
  if (!deferred) return false;
  const event = deferred;
  await event.prompt();
  const choice = await event.userChoice;
  deferred = null;
  notify();
  return choice.outcome === 'accepted';
}
