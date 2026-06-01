"use client";

import { useState, useEffect } from "react";
import { Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallButton({ variant = "button" }: { variant?: "button" | "card" | "header" }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Check if running on iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === "accepted") {
        setIsInstalled(true);
      }
      
      setDeferredPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("Error installing PWA:", error);
    }
  };

  // Don't show if already installed
  if (isInstalled) return null;

  // Card variant for sidebar/profile - always show with iOS instructions
  if (variant === "card") {
    if (isIOS) {
      return (
        <div className="w-full p-4 rounded-xl glass-card">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-foreground text-sm mb-1">Install MrCash</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tap the share icon 
                <span className="inline-block mx-1 px-1.5 py-0.5 bg-secondary rounded text-[10px]">Share</span>
                then select &quot;Add to Home Screen&quot;
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (!isInstallable) {
      return (
        <div className="w-full p-4 rounded-xl glass-card opacity-60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground text-sm">App Installed</p>
              <p className="text-xs text-muted-foreground">MrCash is on your device</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        className="w-full flex items-center gap-3 p-4 rounded-xl glass-card hover:bg-secondary/50 transition-colors group"
      >
        <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
          <Download className="w-5 h-5 text-white" />
        </div>
        <div className="text-left">
          <p className="font-bold text-foreground text-sm">Install App</p>
          <p className="text-xs text-muted-foreground">Add MrCash to your device</p>
        </div>
      </button>
    );
  }

  // Header variant - compact icon button
  if (variant === "header") {
    // Don't show header button for iOS (they need the card instructions)
    if (isIOS || !isInstallable) return null;

    return (
      <button
        onClick={handleInstallClick}
        className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        title="Install App"
      >
        <Download className="h-4 w-4" />
      </button>
    );
  }

  // Default button variant
  if (!isInstallable && !isIOS) return null;

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl brand-gradient text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-lg glow-primary"
    >
      <Download className="w-4 h-4" />
      <span>Install App</span>
    </button>
  );
}
