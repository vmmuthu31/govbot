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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Wallet,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type WalletAccount = {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
};

type ConnectedWallet = {
  name: string;
  version: string;
  accounts: WalletAccount[];
};

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
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const loadPersistedState = async () => {
      try {
        const { walletService } = await import("@/services/wallet");
        const wallet = await walletService.verifyAndRefreshConnection();
        if (wallet) {
          setConnectedWallet(wallet);

          const persistedAccountAddress = localStorage.getItem(
            "selectedAccountAddress"
          );
          if (persistedAccountAddress && onAccountSelected) {
            const account = wallet.accounts.find(
              (acc) => acc.address === persistedAccountAddress
            );
            if (account) {
              onAccountSelected(account);
            } else if (wallet.accounts.length > 0) {
              onAccountSelected(wallet.accounts[0]);
              localStorage.setItem(
                "selectedAccountAddress",
                wallet.accounts[0].address
              );
            }
          } else if (wallet.accounts.length > 0 && onAccountSelected) {
            onAccountSelected(wallet.accounts[0]);
            localStorage.setItem(
              "selectedAccountAddress",
              wallet.accounts[0].address
            );
          }
        }
      } catch (error) {
        console.error("Error loading persisted wallet state:", error);
      }
    };

    loadPersistedState();
  }, [isClient, onAccountSelected]);

  useEffect(() => {
    if (!isClient || typeof window === "undefined") {
      return;
    }

    const checkAvailableWallets = async () => {
      try {
        const { walletService } = await import("@/services/wallet");
        const wallets = await walletService.getAvailableWallets();
        setAvailableWallets(wallets);
        if (wallets.length > 0) {
          setSelectedWallet(wallets[0]);
        }
      } catch (error) {
        console.error("Error checking available wallets:", error);
      }
    };

    const loadConnectedWallet = async () => {
      try {
        const { walletService } = await import("@/services/wallet");
        const wallet = walletService.getConnectedWallet();
        if (wallet) {
          setConnectedWallet(wallet);
        }
      } catch (error) {
        console.error("Error loading connected wallet:", error);
      }
    };

    if (open) {
      checkAvailableWallets();
      loadConnectedWallet();
    }
  }, [open, isClient]);

  const handleConnect = async () => {
    if (!isClient) return;

    if (!selectedWallet) {
      toast.error("Please select a wallet");
      return;
    }

    try {
      setLoading(true);
      const { walletService } = await import("@/services/wallet");
      const wallet = await walletService.connectWallet(selectedWallet);
      setConnectedWallet(wallet);

      toast.success(
        `Connected to ${wallet.name} with ${wallet.accounts.length} account(s)`
      );

      if (wallet.accounts.length > 0) {
        const firstAccount = wallet.accounts[0];
        if (onAccountSelected) {
          onAccountSelected(firstAccount);
        }
        localStorage.setItem("selectedAccountAddress", firstAccount.address);
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

  const handleDisconnect = async () => {
    if (!isClient) return;

    try {
      const { walletService } = await import("@/services/wallet");
      walletService.disconnect();
      setConnectedWallet(null);
      if (onAccountSelected) {
        onAccountSelected(null);
      }
      localStorage.removeItem("selectedAccountAddress");
      toast.success("Wallet disconnected");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  };

  const handleAccountSelect = (account: WalletAccount) => {
    localStorage.setItem("selectedAccountAddress", account.address);

    if (onAccountSelected) {
      onAccountSelected(account);
    }

    setOpen(false);

    toast.success(`Switched to account: ${account.name || "Unnamed Account"}`);
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

  if (!isClient) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Wallet className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (connectedWallet) {
    let displayAccount = selectedAccount;

    if (!displayAccount && typeof window !== "undefined") {
      const persistedAccountAddress = localStorage.getItem(
        "selectedAccountAddress"
      );
      if (persistedAccountAddress) {
        displayAccount = connectedWallet.accounts.find(
          (acc) => acc.address === persistedAccountAddress
        );
      }
    }

    if (!displayAccount && connectedWallet.accounts.length > 0) {
      displayAccount = connectedWallet.accounts[0];
    }

    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="min-w-[180px] justify-between"
            >
              <div className="flex items-center">
                <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                <div className="flex flex-col items-start">
                  <span className="text-xs text-muted-foreground"></span>
                  <span className="text-sm font-mono">
                    {displayAccount
                      ? formatAddress(displayAccount.address)
                      : "Select Account"}
                  </span>
                </div>
              </div>
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[300px]">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {getWalletDisplayName(connectedWallet.name)}
              </p>
              <p className="text-xs text-muted-foreground">
                {connectedWallet.accounts.length} account(s) available
              </p>
            </div>
            <DropdownMenuSeparator />

            {/* Current Account Info */}
            {displayAccount && (
              <>
                <div className="px-2 py-1.5">
                  <p className="text-xs text-muted-foreground mb-1">
                    Current Account
                  </p>
                  <p className="text-sm font-medium">
                    {displayAccount.name || "Unnamed Account"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {displayAccount.address.slice(0, 6)}...
                    {displayAccount.address.slice(-6)}
                  </p>
                </div>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Quick Actions */}
            {displayAccount && (
              <>
                <DropdownMenuItem
                  onClick={() => copyAddress(displayAccount.address)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Address
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    window.open(
                      `https://polkadot.subscan.io/account/${displayAccount.address}`,
                      "_blank"
                    )
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Subscan
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            {/* Account Selection */}
            <DropdownMenuItem onClick={() => setOpen(true)}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Change Account
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleDisconnect}>
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Account Selection Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Select Account</DialogTitle>
              <DialogDescription>
                Choose which account to use for transactions
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Available Accounts</h4>
                <div className="max-h-60 space-y-2 overflow-y-auto">
                  {connectedWallet.accounts.map((account, index) => {
                    const isSelected =
                      displayAccount?.address === account.address;
                    return (
                      <div
                        key={account.address}
                        className={`cursor-pointer rounded-md border p-3 transition-colors hover:bg-muted/50 ${
                          isSelected ? "border-primary bg-primary/5" : ""
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
                            {isSelected && (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            )}
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
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
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
