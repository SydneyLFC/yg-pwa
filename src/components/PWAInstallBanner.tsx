'use client';

import React, { useEffect, useState } from 'react';

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

function isSecureContextBrowser() {
  if (typeof window === 'undefined') return false;
  return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
}

function isiOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isInStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
         // iOS PWA heuristic:
         (window.navigator as any).standalone === true;
}

export default function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Never show in insecure contexts or if already installed
    if (!isSecureContextBrowser() || isInStandaloneMode()) return;

    // ANDROID/desktop Chrome: listen for beforeinstallprompt
    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // stop the mini-infobar
      setDeferredPrompt(e as BIPEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);

    // iOS Safari/Chrome (WebKit): no beforeinstallprompt; show instructions
    if (isiOS()) {
      setShow(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as any);
    };
  }, []);

  if (!show) return null;

  const onInstallClick = async () => {
    if (!deferredPrompt) return; // iOS: nothing to prompt
    try {
      await deferredPrompt.prompt();
      // Optional: await deferredPrompt.userChoice
    } finally {
      setDeferredPrompt(null);
      setShow(false);
    }
  };

  const onDismiss = () => setShow(false);

  return (
    <div style={{
      position: 'fixed',
      bottom: 12,
      left: 12,
      right: 12,
      zIndex: 60,
      background: '#fff',
      border: '1px solid #ddd',
      borderRadius: 12,
      padding: '12px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,.08)'
    }}>
      {isiOS() ? (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Install YaraGlow?</div>
          <div style={{ fontSize: 14, color: '#444' }}>
            On iPhone, tap <b>Share</b> and choose <b>Add to Home Screen</b>.
          </div>
        </div>
      ) : (
        <div>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Install YaraGlow for faster access and offline use?
          </div>
          <button onClick={onInstallClick} style={{ marginRight: 8 }}>
            Install
          </button>
          <button onClick={onDismiss}>Not now</button>
        </div>
      )}
    </div>
  );
}