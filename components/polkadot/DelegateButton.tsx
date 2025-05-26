/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { Vote, UsersRound, ExternalLink, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const WalletConnect = dynamic(
  () => import("../wallet/WalletConnect").then((mod) => mod.WalletConnect),
  {
    ssr: false,
  }
);

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useNetwork } from "@/lib/network-context";

export function DelegateButton() {
  const { networkConfig } = useNetwork();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [conviction, setConviction] = useState("1");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);

  const tracks = [0, 2, 34, 33, 32, 31, 30, 11, 1, 10, 12, 13, 14, 15, 20, 21];

  const handleDelegate = async () => {
    if (!selectedAccount) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!amount) {
      toast.error("Please enter an amount to delegate");
      return;
    }

    try {
      setLoading(true);

      const { polkadotClientService } = await import(
        "../../services/polkadot-client"
      );

      const delegateAddress =
        process.env.NEXT_PUBLIC_POLKADOT_BOT_ADDRESS ||
        "1FN1XvRXhVBfWN6mxHyUsWsGLjrHqFM6RvJZVRp1UvXH3HU";

      const txHash = await polkadotClientService.delegateVotingPowerClient(
        selectedAccount,
        amount,
        parseInt(conviction),
        delegateAddress,
        tracks,
        networkConfig.id
      );

      setTxHash(txHash);
      toast.success("Delegation transaction submitted successfully!");
    } catch (error) {
      console.error("Error delegating voting power:", error);
      toast.error(
        `Failed to delegate voting power: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setAmount("");
    setConviction("1");
    setTxHash(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex gap-2"
        >
          <div className="relative">
            <Vote className="h-4 w-4 text-primary" />
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
          <span className="hidden lg:inline">Delegate to GovBot</span>
          <span className="lg:hidden">Delegate</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="relative">
              <Vote className="h-5 w-5 text-primary" />
              <UsersRound className="h-3 w-3 text-blue-500 absolute -bottom-1 -right-1" />
            </div>
            Delegate Voting Power to GovBot
          </DialogTitle>
          <DialogDescription>
            Increase GovBot&apos;s influence in Polkadot governance by
            delegating your {networkConfig.currency.symbol} tokens. Your tokens
            remain yours while GovBot votes on your behalf with transparent,
            AI-driven decisions.
          </DialogDescription>
        </DialogHeader>

        {txHash ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md bg-green-50 border border-green-200 p-4 dark:bg-green-950 dark:border-green-800">
              <h4 className="mb-2 font-medium text-green-800 dark:text-green-200">
                Transaction Submitted Successfully
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your delegation transaction has been submitted to the Polkadot
                network.
              </p>
              {txHash !== "Transaction completed successfully" && (
                <div className="mt-3 flex items-center">
                  <Label className="text-xs text-green-700 dark:text-green-300">
                    Transaction Hash:
                  </Label>
                  <code className="ml-2 overflow-hidden text-ellipsis rounded-md bg-green-100 dark:bg-green-900 px-2 py-1 text-xs">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </code>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleClose}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Connected Wallet</Label>
              <WalletConnect
                onAccountSelected={(account) => {
                  setSelectedAccount(account);
                }}
                selectedAccount={selectedAccount}
              />
              {selectedAccount && (
                <p className="text-xs text-muted-foreground">
                  Using: {selectedAccount.name || "Unnamed Account"} (
                  {selectedAccount.address.slice(0, 8)}...)
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount (DOT)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="100"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="conviction">Conviction</Label>
              <Select value={conviction} onValueChange={setConviction}>
                <SelectTrigger id="conviction">
                  <SelectValue placeholder="Select conviction multiplier" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">
                    0x (No timelock, no multiplier)
                  </SelectItem>
                  <SelectItem value="1">1x (1 enactment period)</SelectItem>
                  <SelectItem value="2">2x (2 enactment periods)</SelectItem>
                  <SelectItem value="3">3x (4 enactment periods)</SelectItem>
                  <SelectItem value="4">4x (8 enactment periods)</SelectItem>
                  <SelectItem value="5">5x (16 enactment periods)</SelectItem>
                  <SelectItem value="6">6x (32 enactment periods)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Higher conviction means more voting power but longer lock
                period.
              </p>
            </div>

            <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200 dark:border-blue-800 p-4 text-sm">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <UsersRound className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    🤝 Safe & Transparent Delegation
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    By delegating, you&apos;re giving GovBot the authority to
                    vote on your behalf, but your tokens remain yours and can be
                    undelegated anytime.
                  </p>
                  <div className="flex justify-center pt-1">
                    <a
                      href="https://wiki.polkadot.network/docs/learn-opengov#conviction-voting"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
                    >
                      📚 Learn more about delegations
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                onClick={handleDelegate}
                disabled={loading || !selectedAccount}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Delegating...
                  </>
                ) : !selectedAccount ? (
                  "Connect Wallet First"
                ) : (
                  "Delegate"
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
