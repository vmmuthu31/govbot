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

  useEffect(() => {
    if (open) {
      const messageIndex = Math.floor(Math.random() * NUDGE_MESSAGES.length);
      const gifIndex = Math.floor(Math.random() * WALLET_GIFS.length);
      setCurrentMessage(NUDGE_MESSAGES[messageIndex]);
      setCurrentGif(WALLET_GIFS[gifIndex]);
    }
  }, [open]);

  const fetchRandomWalletGif = async () => {
    setIsLoadingGif(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=9uQcPH8kVt6PVposLVjSYSBjzwjlMCy0&q=wallet+crypto+blockchain&limit=20&rating=g`
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
      const fallbackIndex = Math.floor(Math.random() * WALLET_GIFS.length);
      setCurrentGif(WALLET_GIFS[fallbackIndex]);
    } finally {
      setIsLoadingGif(false);
    }
  };

  const handleNewGif = () => {
    fetchRandomWalletGif();
    const newMessageIndex = Math.floor(Math.random() * NUDGE_MESSAGES.length);
    setCurrentMessage(NUDGE_MESSAGES[newMessageIndex]);
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
              disabled={isLoadingGif}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoadingGif ? "animate-spin" : ""}`}
              />
            </Button>
          </div>

          <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            {title || currentMessage.title}
          </DialogTitle>

          <DialogDescription className="text-base text-muted-foreground leading-relaxed">
            {description || currentMessage.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-4">
          {/* Fun Stats or Benefits */}
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

          {/* Wallet Connection Component */}
          <div className="flex flex-col items-center space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4" />
              <span>Connect your wallet to get started</span>
              <Sparkles className="h-4 w-4" />
            </div>

            <WalletConnect
              onAccountSelected={(account) => {
                onAccountSelected(account);
                if (account) {
                  onOpenChange(false);
                }
              }}
              selectedAccount={selectedAccount}
            />
          </div>

          {/* Fun Footer */}
          <div className="text-center text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-center gap-1">
              <Wallet className="h-3 w-3" />
              <span>Secure • Decentralized • Your keys, your crypto</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
