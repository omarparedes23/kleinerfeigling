"use client";

import { useEffect, useState } from "react";

interface UserChoiceResult {
  outcome: "accepted" | "dismissed";
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<UserChoiceResult>;
  prompt(): Promise<void>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already loaded in standalone display mode
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    if (isStandalone) {
      setIsInstallable(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Store the event object
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen also for appinstalled event to clean up if user installed it from address bar
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = async (): Promise<"accepted" | "dismissed"> => {
    if (!deferredPrompt) {
      return "dismissed";
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      // Set state to null after the prompt is completed
      setDeferredPrompt(null);
      setIsInstallable(false);
      
      return choiceResult.outcome;
    } catch (error) {
      console.error("PWA installation prompt failed:", error);
      setDeferredPrompt(null);
      setIsInstallable(false);
      return "dismissed";
    }
  };

  return {
    isInstallable,
    installApp,
  };
}
