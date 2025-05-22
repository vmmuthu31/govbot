"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  walletService,
  type ConnectedWallet,
  type WalletAccount,
} from "@/services/wallet";

interface WalletConnectProps {
  onAccountSelected?: (account: WalletAccount | null) => void;
  selectedAccount?: WalletAccount | null;
}

export function WalletConnect({
  onAccountSelected,
  selectedAccount,
}: WalletConnectProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableWallets, setAvailableWallets] = useState<string[]>([]);
  const [connectedWallet, setConnectedWallet] =
    useState<ConnectedWallet | null>(null);
  const [selectedWallet, setSelectedWallet] = useState<string>("");

  useEffect(() => {
    if (open) {
      checkAvailableWallets();
      const wallet = walletService.getConnectedWallet();
      if (wallet) {
        setConnectedWallet(wallet);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, selectedAccount]);

  const checkAvailableWallets = async () => {
    try {
      const wallets = await walletService.getAvailableWallets();
      setAvailableWallets(wallets);
      if (wallets.length > 0) {
        setSelectedWallet(wallets[0]);
      }
    } catch (error) {
      console.error("Error checking available wallets:", error);
    }
  };

  const handleConnect = async () => {
    if (!selectedWallet) {
      toast.error("Please select a wallet");
      return;
    }

    try {
      setLoading(true);
      const wallet = await walletService.connectWallet(selectedWallet);
      setConnectedWallet(wallet);

      toast.success(
        `Connected to ${wallet.name} with ${wallet.accounts.length} account(s)`
      );

      if (wallet.accounts.length > 0 && onAccountSelected) {
        onAccountSelected(wallet.accounts[0]);
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to connect wallet"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    walletService.disconnect();
    setConnectedWallet(null);
    if (onAccountSelected) {
      onAccountSelected(null);
    }
    toast.success("Wallet disconnected");
  };

  const handleAccountSelect = (account: WalletAccount) => {
    if (onAccountSelected) {
      onAccountSelected(account);
    }
    setOpen(false);
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const getWalletDisplayName = (walletName: string) => {
    switch (walletName) {
      case "polkadot-js":
        return "Polkadot.js";
      case "subwallet-js":
        return "SubWallet";
      case "talisman":
        return "Talisman";
      default:
        return walletName;
    }
  };

  if (connectedWallet) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
            {selectedAccount
              ? formatAddress(selectedAccount.address)
              : "Select Account"}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              Connected to {getWalletDisplayName(connectedWallet.name)}
            </DialogTitle>
            <DialogDescription>
              Select an account to use for transactions
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">
                    {getWalletDisplayName(connectedWallet.name)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Version {connectedWallet.version}
                  </p>
                </div>
                <Badge variant="secondary">
                  {connectedWallet.accounts.length} accounts
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Available Accounts</h4>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {connectedWallet.accounts.map((account, index) => (
                  <div
                    key={account.address}
                    className={`cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                      selectedAccount?.address === account.address
                        ? "border-primary bg-primary/5"
                        : ""
                    }`}
                    onClick={() => handleAccountSelect(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {account.name || `Account ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">
                          {formatAddress(account.address)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyAddress(account.address);
                          }}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(
                              `https://polkadot.subscan.io/account/${account.address}`,
                              "_blank"
                            );
                          }}
                        >
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={handleDisconnect}>
                Disconnect
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Wallet className="mr-2 h-4 w-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Connect Wallet</DialogTitle>
          <DialogDescription>
            Connect your Polkadot wallet to participate in governance
          </DialogDescription>
        </DialogHeader>

        {availableWallets.length === 0 ? (
          <div className="space-y-4 py-4">
            <div className="rounded-md border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    No wallet extension found
                  </h3>
                  <p className="mt-1 text-sm text-orange-700 dark:text-orange-300">
                    Please install a Polkadot wallet extension to continue.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recommended wallets:</h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open("https://polkadot.js.org/extension/", "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Polkadot.js Extension
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() =>
                    window.open("https://subwallet.app/", "_blank")
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  SubWallet
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open("https://talisman.xyz/", "_blank")}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Talisman
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Wallet</label>
              <Select value={selectedWallet} onValueChange={setSelectedWallet}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a wallet" />
                </SelectTrigger>
                <SelectContent>
                  {availableWallets.map((wallet) => (
                    <SelectItem key={wallet} value={wallet}>
                      {getWalletDisplayName(wallet)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
              <p>
                Make sure your wallet extension is unlocked and ready to use.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={loading || !selectedWallet}
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
