"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Smartphone, 
  Tablet, 
  Laptop, 
  Share, 
  PlusSquare, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  ExternalLink,
  QrCode
} from "lucide-react";

interface AppleDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AppleDownloadModal({ isOpen, onClose }: AppleDownloadModalProps) {
  const [activeDevice, setActiveDevice] = useState<"ios" | "ipad" | "mac">("ios");
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [currentUrl, setCurrentUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.origin);
      
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setInstallPrompt(e);
      };

      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      return () => {
        window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleNativeInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      alert("To install on Apple devices, tap the Share icon in Safari and select 'Add to Home Screen' or 'Add to Dock'.");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-gradient-to-b from-[#161d2d] to-[#0c1019] border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden text-gray-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 px-6 py-2 flex items-center justify-between text-black font-semibold text-xs tracking-wider uppercase">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 fill-black" />
            Apple Ecosystem Dedicated Client
          </span>
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Apple WebKit Native PWA
          </span>
        </div>

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Download <span className="gold-gradient-text">Gridiron Apex</span>
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Optimized for iPhone, iPad & Mac with instant live push, zero lag, and offline caching
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Device Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-900/80 rounded-xl border border-gray-800">
            <button
              onClick={() => setActiveDevice("ios")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeDevice === "ios"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md font-semibold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>iPhone</span>
            </button>
            <button
              onClick={() => setActiveDevice("ipad")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeDevice === "ipad"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md font-semibold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Tablet className="w-4 h-4" />
              <span>iPad</span>
            </button>
            <button
              onClick={() => setActiveDevice("mac")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeDevice === "mac"
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-md font-semibold"
                  : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Mac</span>
            </button>
          </div>

          {/* Device Specific Installation Instructions */}
          {activeDevice === "ios" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> 30-Second iPhone Installation Guide (iOS 16, 17, 18+)
                </div>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      1
                    </span>
                    <span>
                      Open this URL in <strong className="text-white">Safari</strong> on your iPhone.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      2
                    </span>
                    <span>
                      Tap the <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs"><Share className="w-3.5 h-3.5 text-blue-400" /> Share</strong> button at the bottom navigation bar.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      3
                    </span>
                    <span>
                      Scroll down and tap <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs"><PlusSquare className="w-3.5 h-3.5 text-amber-400" /> Add to Home Screen</strong>, then tap <strong className="text-white">Add</strong>.
                    </span>
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs text-amber-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Fullscreen standalone app mode enabled
                </span>
                <span className="text-gray-400">No App Store account needed</span>
              </div>
            </div>
          )}

          {activeDevice === "ipad" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> iPadOS Full-Canvas Installation
                </div>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      1
                    </span>
                    <span>
                      Open this site in <strong className="text-white">Safari</strong> on your iPad.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      2
                    </span>
                    <span>
                      Tap the <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs"><Share className="w-3.5 h-3.5 text-blue-400" /> Share icon</strong> in the top-right toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      3
                    </span>
                    <span>
                      Choose <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-gray-800 rounded border border-gray-700 text-xs"><PlusSquare className="w-3.5 h-3.5 text-amber-400" /> Add to Home Screen</strong>. Gridiron Apex will run in native multi-window Stage Manager.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeDevice === "mac" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-3">
                <div className="text-sm font-semibold text-amber-400 flex items-center gap-2">
                  <Laptop className="w-4 h-4" /> macOS Dock App (Sonoma, Sequoia & beyond)
                </div>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      1
                    </span>
                    <span>
                      In <strong className="text-white">Safari</strong> on macOS, click the <strong className="text-white">File</strong> menu or the Share icon in the toolbar.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      2
                    </span>
                    <span>
                      Click <strong className="text-white">Add to Dock...</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
                      3
                    </span>
                    <span>
                      Click <strong className="text-white">Add</strong>. Gridiron Apex will appear in your Mac Dock and Launchpad with a dedicated window and separate profile!
                    </span>
                  </li>
                </ol>
              </div>

              {/* If on Chrome/Edge on Mac */}
              <div className="text-xs text-gray-400 bg-gray-950 p-3 rounded-lg border border-gray-800">
                <span className="font-medium text-gray-300">Using Chrome or Arc on Mac?</span> Click the install icon <Download className="w-3.5 h-3.5 inline mx-1 text-amber-400" /> on the right side of the address bar to install instantly.
              </div>
            </div>
          )}

          {/* Quick Actions & Share Link */}
          <div className="pt-2 border-t border-gray-800 flex flex-col sm:flex-row gap-3">
            {installPrompt && (
              <button
                onClick={handleNativeInstall}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Install Web App Now
              </button>
            )}

            <button
              onClick={handleCopyLink}
              className="flex-1 py-3 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition-all text-gray-200"
            >
              <ExternalLink className="w-4 h-4 text-amber-400" />
              {isCopied ? "Link Copied to Clipboard!" : "Copy App Link for Apple Device"}
            </button>
          </div>

          {/* Features Highlights */}
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-gray-400">
            <div className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-800/80">
              <div className="font-semibold text-white">0 MB Storage</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Streamlined & fast</div>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-800/80">
              <div className="font-semibold text-white">Always Fresh</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Auto-updating AI feeds</div>
            </div>
            <div className="p-2.5 rounded-lg bg-gray-900/40 border border-gray-800/80">
              <div className="font-semibold text-white">Cross-Device</div>
              <div className="text-[10px] text-gray-400 mt-0.5">Synced favorites</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
