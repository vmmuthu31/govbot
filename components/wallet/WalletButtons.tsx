"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { toast } from "sonner";
import { EWallet } from "@/lib/types";
import { walletService } from "@/services/wallet";
import { WEB3_AUTH_SIGN_MESSAGE } from "@/utils/constants";
import { InjectedAccount } from "@polkadot/extension-inject/types";

interface WalletButtonsProps {
  onWalletChange?: (wallet: EWallet | null) => void;
  small?: boolean;
  hidePreference?: boolean;
  disabled?: boolean;
}

interface UserPreferences {
  wallet: EWallet | null;
}

const useUserPreferences = () => {
  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    wallet: null,
  });

  return { userPreferences, setUserPreferences };
};

const useWalletService = () => {
  return walletService;
};

export function WalletButtons({
  onWalletChange,
  small = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  hidePreference = false,
  disabled = false,
}: WalletButtonsProps) {
  const walletService = useWalletService();
  const [availableWallets, setAvailableWallets] = useState<
    Record<string, unknown>
  >({});
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [selectedAccount, setSelectedAccount] =
    useState<InjectedAccount | null>(null);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<EWallet | null>(null);

  const { userPreferences, setUserPreferences } = useUserPreferences();

  useEffect(() => {
    const injectedWallets = walletService?.getInjectedWallets() || {};
    setAvailableWallets(injectedWallets);

    if (userPreferences.wallet) {
      setSelectedWallet(userPreferences.wallet);
    } else if (Object.keys(injectedWallets).length > 0) {
      const firstWallet = Object.keys(injectedWallets)[0] as EWallet;
      setSelectedWallet(firstWallet);
      setUserPreferences({
        ...userPreferences,
        wallet: firstWallet,
      });
    }
  }, [walletService, userPreferences, setUserPreferences]);

  const getAccounts = useCallback(async () => {
    if (!walletService || !selectedWallet) return;

    setAccountsLoading(true);
    try {
      const injectedAccounts = await walletService.getAddressesFromWallet(
        selectedWallet
      );

      if (!injectedAccounts || injectedAccounts.length === 0) {
        setAccounts([]);
        setAccountsLoading(false);
        return;
      }

      setAccounts(injectedAccounts);

      if (!selectedAccount && injectedAccounts.length > 0) {
        setSelectedAccount(injectedAccounts[0]);
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      toast.error("Failed to fetch accounts from wallet");
    } finally {
      setAccountsLoading(false);
    }
  }, [walletService, selectedWallet, selectedAccount]);

  useEffect(() => {
    if (selectedWallet) {
      getAccounts();
    }
  }, [selectedWallet, getAccounts]);

  const handleAddressLink = async () => {
    if (!selectedWallet || !selectedAccount || !walletService) {
      toast.error("Please select a wallet and account first");
      return;
    }

    setLoading(true);
    try {
      const signature = await walletService.signMessage({
        address: selectedAccount.address,
        data: WEB3_AUTH_SIGN_MESSAGE,
        selectedWallet,
      });

      if (!signature) {
        console.error("Failed to sign message");
        toast.error("Failed to sign message with your wallet");
        setLoading(false);
        return;
      }

      toast.success("Message signed successfully!");

      if (onWalletChange) {
        onWalletChange(selectedWallet);
      }
    } catch (error) {
      console.error("Error signing message:", error);
      toast.error(
        "Failed to sign message: " +
          (error instanceof Error ? error.message : "Unknown error")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    setSelectedAccount(null);
    setAccounts([]);
    setSelectedWallet(null);

    if (onWalletChange) {
      onWalletChange(null);
    }

    setUserPreferences({
      ...userPreferences,
      wallet: null,
    });

    toast.success("Wallet disconnected");
  };

  if (!selectedWallet || !selectedAccount) {
    return (
      <Button
        onClick={handleAddressLink}
        disabled={
          disabled ||
          loading ||
          accountsLoading ||
          Object.keys(availableWallets).length === 0
        }
        variant="outline"
        size={small ? "sm" : "default"}
      >
        {loading || accountsLoading ? (
          <>
            <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {small ? "" : "Connecting..."}
          </>
        ) : (
          <>
            <Wallet className={small ? "h-4 w-4" : "mr-2 h-5 w-5"} />
            {small ? "" : "Connect Wallet"}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {selectedAccount.name ||
            selectedAccount.address.substring(0, 8) + "..."}
        </span>
        {!small && (
          <span className="text-xs text-muted-foreground">
            {selectedWallet
              ? Object.getPrototypeOf(
                  walletService
                ).constructor.getWalletNameLabel(selectedWallet)
              : ""}
          </span>
        )}
      </div>
      <Button
        onClick={handleDisconnect}
        variant="ghost"
        size="sm"
        disabled={disabled}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
