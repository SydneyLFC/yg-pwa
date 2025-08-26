// Mark this file as client-only if you import it directly in components.
// 'use client';

type DeferredPrompt = any;

const isIOS = () => {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPhone/iPod and older iPads:
  const iOSClassic = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ sometimes reports as Mac with touch
  const iPadOS13Plus = navigator.platform === "MacIntel" && (navigator as any).maxTouchPoints > 1;
  return iOSClassic || iPadOS13Plus;
};

const isStandaloneDisplay = () => {
  if (typeof window === "undefined") return false;
  // iOS (Safari-embedded)
  // @ts-ignore
  if (window.navigator.standalone) return true;
  // Other platforms
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches;
};

const COOLDOWN_KEY = "pwa_install_prompt_last";
const COOLDOWN_HOURS = 48; // show at most every 2 days

const inCooldown = () => {
  try {
    const ts = localStorage.getItem(COOLDOWN_KEY);
    if (!ts) return false;
    return (Date.now() - Number(ts)) < COOLDOWN_HOURS * 3600 * 1000;
  } catch { return false; }
};

const setCooldown = () => {
  try { localStorage.setItem(COOLDOWN_KEY, String(Date.now())); } catch {}
};

export function initPWAInstallPrompts() {
  if (typeof window === "undefined") return;

  // Don’t prompt inside installed app
  if (isStandaloneDisplay()) return;

  // Android/Chromium: capture and defer the install prompt
  let deferredPrompt: DeferredPrompt | null = null;

  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    // @ts-ignore
    deferredPrompt = e;
    if (!isIOS() && !inCooldown()) {
      showAndroidPrompt(deferredPrompt);
    }
  });

  // iOS: show custom “Add to Home Screen” helper
  if (isIOS() && !inCooldown()) {
    showIOSInstallPrompt();
  }
}

/** ANDROID / CHROMIUM */
function showAndroidPrompt(deferredPrompt: DeferredPrompt) {
  // Build a lightweight toast-style prompt
  const el = document.createElement('div');
  el.className = 'pwa-install-toast';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="pwa-card">
      <p>Install YaraGlow for faster access and offline use?</p>
      <div class="pwa-actions">
        <button class="pwa-btn pwa-install">Install</button>
        <button class="pwa-btn pwa-dismiss" aria-label="Dismiss">Not now</button>
      </div>
    </div>
  `;
  document.body.appendChild(el);

  const cleanup = () => { el.remove(); setCooldown(); };

  el.querySelector<HTMLButtonElement>('.pwa-install')?.addEventListener('click', async () => {
    if (!deferredPrompt) return cleanup();
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice.catch(() => null);
    deferredPrompt = null;
    cleanup();
  });

  el.querySelector<HTMLButtonElement>('.pwa-dismiss')?.addEventListener('click', cleanup);
  el.addEventListener('keyup', (evt: any) => { if (evt.key === 'Escape') cleanup(); });
}

/** iOS SAFARI */
function showIOSInstallPrompt() {
  const el = document.createElement('div');
  el.className = 'ios-install-prompt';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.innerHTML = `
    <div class="pwa-card">
      <p>
        Install this app on your iPhone: tap
        <img class="ios-share" src="/icons/share-icon.png" alt="Share icon" />
        then <strong>Add to Home Screen</strong>.
      </p>
      <button class="pwa-btn pwa-dismiss" aria-label="Dismiss">Got it</button>
    </div>
  `;
  document.body.appendChild(el);

  const dismiss = () => { el.remove(); setCooldown(); };
  el.querySelector<HTMLButtonElement>('.pwa-dismiss')?.addEventListener('click', dismiss);
  el.addEventListener('keyup', (evt: any) => { if (evt.key === 'Escape') dismiss(); });
}