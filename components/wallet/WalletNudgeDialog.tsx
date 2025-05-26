"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Wallet, Sparkles, RefreshCw } from "lucide-react";
import { WalletConnect } from "./WalletConnect";

type WalletAccount = {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
};

interface WalletNudgeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccountSelected: (account: WalletAccount | null) => void;
  selectedAccount: WalletAccount | null;
  title?: string;
  description?: string;
}

const WALLET_GIFS = [
  "https://media.giphy.com/media/3o7TKF1fSIs1R19B8k/giphy.gif",
  "https://media.giphy.com/media/26BRrSvJUa0crqw4E/giphy.gif",
  "https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif",
  "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif",
  "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
];

const SUCCESS_GIFS = [
  "https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif",
  "https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif",
  "https://media.giphy.com/media/26BRBKqUiq586bRVm/giphy.gif",
  "https://media.giphy.com/media/3o6Zt4HU9uwXmXSAuI/giphy.gif",
  "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
];

const NUDGE_MESSAGES = [
  {
    title: "🚀 Ready to Join the Governance Party?",
    description:
      "Connect your wallet and let's make some democratic magic happen! Your voice matters in the Polkadot ecosystem.",
  },
  {
    title: "🎯 Time to Level Up Your Governance Game!",
    description:
      "Your wallet is your ticket to participate in OpenGov discussions. Let's get you connected and chatting with GovBot!",
  },
  {
    title: "💎 Unlock the Power of Decentralized Governance",
    description:
      "Connect your wallet to start meaningful conversations about proposals that shape the future of Polkadot.",
  },
  {
    title: "🌟 Your Governance Journey Starts Here",
    description:
      "Ready to dive into the world of OpenGov? Connect your wallet and let GovBot guide you through the proposals!",
  },
  {
    title: "🔥 Don't Miss Out on the Governance Action",
    description:
      "The best discussions happen when you're connected! Link your wallet and join the conversation with GovBot.",
  },
];

export function WalletNudgeDialog({
  open,
  onOpenChange,
  onAccountSelected,
  selectedAccount,
  title,
  description,
}: WalletNudgeDialogProps) {
  const [currentGif, setCurrentGif] = useState(WALLET_GIFS[0]);
  const [currentMessage, setCurrentMessage] = useState(NUDGE_MESSAGES[0]);
  const [isLoadingGif, setIsLoadingGif] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(0);
  const [isInCooldown, setIsInCooldown] = useState(false);

  // Only update when dialog opens, not on every selectedAccount change
  useEffect(() => {
    if (open) {
      const messageIndex = Math.floor(Math.random() * NUDGE_MESSAGES.length);
      const gifArray = selectedAccount ? SUCCESS_GIFS : WALLET_GIFS;
      const gifIndex = Math.floor(Math.random() * gifArray.length);
      setCurrentMessage(NUDGE_MESSAGES[messageIndex]);
      setCurrentGif(gifArray[gifIndex]);
    }
  }, [open]); // Removed selectedAccount dependency to prevent rapid updates

  // Only update GIF when selectedAccount changes from null to account or vice versa
  // with debouncing to prevent rapid updates
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedAccount === null) {
        const gifIndex = Math.floor(Math.random() * WALLET_GIFS.length);
        setCurrentGif(WALLET_GIFS[gifIndex]);
      } else if (selectedAccount) {
        const gifIndex = Math.floor(Math.random() * SUCCESS_GIFS.length);
        setCurrentGif(SUCCESS_GIFS[gifIndex]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [selectedAccount]);

  const fetchRandomWalletGif = async () => {
    setIsLoadingGif(true);
    try {
      const searchQuery = selectedAccount
        ? "success+celebration+checkmark"
        : "wallet+crypto+blockchain";
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=9uQcPH8kVt6PVposLVjSYSBjzwjlMCy0&q=${searchQuery}&limit=20&rating=g`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const randomGif =
            data.data[Math.floor(Math.random() * data.data.length)];
          setCurrentGif(randomGif.images.fixed_height.url);
        }
      }
    } catch {
      const fallbackArray = selectedAccount ? SUCCESS_GIFS : WALLET_GIFS;
      const fallbackIndex = Math.floor(Math.random() * fallbackArray.length);
      setCurrentGif(fallbackArray[fallbackIndex]);
    } finally {
      setIsLoadingGif(false);
    }
  };

  const handleNewGif = () => {
    const now = Date.now();
    const cooldownPeriod = 2000; // 2 seconds cooldown

    if (now - lastRefreshTime < cooldownPeriod) {
      return; // Ignore if within cooldown period
    }

    setLastRefreshTime(now);
    setIsInCooldown(true);

    fetchRandomWalletGif();
    const newMessageIndex = Math.floor(Math.random() * NUDGE_MESSAGES.length);
    setCurrentMessage(NUDGE_MESSAGES[newMessageIndex]);

    // Reset cooldown after period
    setTimeout(() => {
      setIsInCooldown(false);
    }, cooldownPeriod);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] overflow-hidden">
        <DialogHeader className="text-center space-y-4">
          <div className="relative mx-auto w-full max-w-[300px] h-[200px] rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 flex items-center justify-center">
            {isLoadingGif ? (
              <div className="flex items-center justify-center">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <img
                src={currentGif}
                alt="Wallet connection animation"
                className="w-full h-full object-cover rounded-lg"
                onError={() => {
                  setCurrentGif(WALLET_GIFS[0]);
                }}
              />
            )}

            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90"
              onClick={handleNewGif}
              disabled={isLoadingGif || isInCooldown}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  isLoadingGif || isInCooldown ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>

          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {selectedAccount
              ? "🎉 Wallet Connected Successfully!"
              : title || currentMessage.title}
          </DialogTitle>

          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            {selectedAccount
              ? "Great! Your wallet is now connected. You can switch accounts, disconnect, or continue with your current selection."
              : description || currentMessage.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Connected Wallet Status */}
          {selectedAccount && (
            <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium text-green-700 dark:text-green-300">
                  Connected Wallet
                </span>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Address:</span>
                  <code className="bg-background px-2 py-1 rounded text-xs">
                    {selectedAccount.address.slice(0, 8)}...
                    {selectedAccount.address.slice(-8)}
                  </code>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Source:</span>
                  <span className="font-medium">{selectedAccount.source}</span>
                </div>
                {selectedAccount.name && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{selectedAccount.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Fun Stats or Benefits - Only show when not connected */}
          {!selectedAccount && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  🗳️
                </div>
                <div className="text-sm font-medium">Vote on Proposals</div>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  💬
                </div>
                <div className="text-sm font-medium">Chat with GovBot</div>
              </div>
            </div>
          )}

          {/* Wallet Connection Component */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>
                {selectedAccount
                  ? "Switch accounts or disconnect your wallet"
                  : "Connect your wallet to get started"}
              </span>
              <Sparkles className="h-4 w-4" />
            </div>

            <WalletConnect
              onAccountSelected={(account) => {
                console.log(
                  "WalletConnect onAccountSelected called with:",
                  account
                );
                onAccountSelected(account);
              }}
              selectedAccount={selectedAccount}
            />
          </div>

          {/* Action Buttons when connected */}
          {selectedAccount && (
            <div className="flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Fun Footer */}
          <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1">
              <Wallet className="h-3 w-3" />
              <span>
                {selectedAccount
                  ? "Connected • Secure • Your keys, your crypto"
                  : "Secure • Decentralized • Your keys, your crypto"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
