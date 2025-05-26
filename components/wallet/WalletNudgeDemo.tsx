"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { WalletNudgeDialog } from "./WalletNudgeDialog";
import { Sparkles, Wallet, Bot } from "lucide-react";

type WalletAccount = {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
};

export function WalletNudgeDemo() {
  const [walletNudgeOpen, setWalletNudgeOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WalletAccount | null>(
    null
  );

  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">
          🎉 Wallet Connection Nudge Demo
        </h3>
        <p className="text-sm text-muted-foreground">
          Click the button below to see our fun wallet connection dialog with
          Giphy integration!
        </p>
      </div>

      <div className="flex flex-col items-center space-y-4">
        <Button
          onClick={() => setWalletNudgeOpen(true)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium px-6 py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Try Wallet Nudge Dialog
          <Sparkles className="ml-2 h-5 w-5" />
        </Button>

        {selectedAccount && (
          <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <Wallet className="h-4 w-4" />
              <span className="font-medium">Wallet Connected!</span>
            </div>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
              Address: {selectedAccount.address.slice(0, 8)}...
              {selectedAccount.address.slice(-8)}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              Source: {selectedAccount.source}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <div className="p-4 border rounded-lg text-center space-y-2">
            <Bot className="h-8 w-8 mx-auto text-blue-500" />
            <h4 className="font-medium">Interactive GIFs</h4>
            <p className="text-xs text-muted-foreground">
              Random wallet/crypto GIFs from Giphy API with refresh button
            </p>
          </div>

          <div className="p-4 border rounded-lg text-center space-y-2">
            <Sparkles className="h-8 w-8 mx-auto text-purple-500" />
            <h4 className="font-medium">Fun Messages</h4>
            <p className="text-xs text-muted-foreground">
              Randomized encouraging messages to boost engagement
            </p>
          </div>

          <div className="p-4 border rounded-lg text-center space-y-2">
            <Wallet className="h-8 w-8 mx-auto text-green-500" />
            <h4 className="font-medium">Seamless UX</h4>
            <p className="text-xs text-muted-foreground">
              Integrated wallet connection with beautiful gradients
            </p>
          </div>
        </div>
      </div>

      <WalletNudgeDialog
        open={walletNudgeOpen}
        onOpenChange={setWalletNudgeOpen}
        onAccountSelected={setSelectedAccount}
        selectedAccount={selectedAccount}
      />
    </div>
  );
}
