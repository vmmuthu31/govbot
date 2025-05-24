if (typeof window === "undefined") {
  throw new Error(
    "services/wallet.ts must only be imported in a browser/client component. It cannot be used in SSR or API routes. Add 'use client' directive to any component that imports this module."
  );
}

import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";

export interface WalletAccount {
  address: string;
  name?: string;
  source: string;
  type?: string;
  genesisHash?: string;
}

export interface ConnectedWallet {
  name: string;
  version: string;
  accounts: WalletAccount[];
}

class WalletService {
  private static instance: WalletService;
  private connectedWallet: ConnectedWallet | null = null;
  private extensions: InjectedExtension[] = [];
  private accounts: InjectedAccountWithMeta[] = [];
  private readonly STORAGE_KEY = "govbot_connected_wallet";

  private constructor() {
    this.loadPersistedWallet();
  }

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Load persisted wallet connection from localStorage
   */
  private loadPersistedWallet(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.connectedWallet = JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading persisted wallet:", error);
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Persist wallet connection to localStorage
   */
  private persistWallet(): void {
    if (typeof window === "undefined") return;

    if (this.connectedWallet) {
      localStorage.setItem(
        this.STORAGE_KEY,
        JSON.stringify(this.connectedWallet)
      );
    } else {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Check if browser has Polkadot.js extension or Subwallet installed
   */
  async getAvailableWallets(): Promise<string[]> {
    if (typeof window === "undefined") return [];

    const injectedWeb3 = (
      window as unknown as { injectedWeb3?: Record<string, unknown> }
    ).injectedWeb3;
    const availableWallets: string[] = [];

    if (injectedWeb3?.["polkadot-js"]) {
      availableWallets.push("polkadot-js");
    }

    if (injectedWeb3?.["subwallet-js"]) {
      availableWallets.push("subwallet-js");
    }

    if (injectedWeb3?.["talisman"]) {
      availableWallets.push("talisman");
    }

    return availableWallets;
  }

  /**
   * Connect to wallet extension
   */
  async connectWallet(walletName?: string): Promise<ConnectedWallet> {
    if (typeof window === "undefined") {
      throw new Error(
        "Wallet connection is only available in browser environment"
      );
    }

    try {
      const { web3Enable, web3Accounts } = await import(
        "@polkadot/extension-dapp"
      );

      this.extensions = await web3Enable("GovBot");

      if (this.extensions.length === 0) {
        throw new Error(
          "No wallet extension found. Please install Polkadot.js extension or Subwallet."
        );
      }

      this.accounts = await web3Accounts();

      if (this.accounts.length === 0) {
        throw new Error(
          "No accounts found. Please create an account in your wallet extension."
        );
      }

      let selectedExtension = this.extensions[0];
      if (walletName) {
        const found = this.extensions.find((ext) => ext.name === walletName);
        if (found) {
          selectedExtension = found;
        }
      }

      const walletAccounts = this.accounts
        .filter((account) => account.meta.source === selectedExtension.name)
        .map((account) => ({
          address: account.address,
          name: account.meta.name,
          source: account.meta.source,
          type: account.type,
          genesisHash: account.meta.genesisHash ?? undefined,
        }));

      this.connectedWallet = {
        name: selectedExtension.name,
        version: selectedExtension.version,
        accounts: walletAccounts,
      };

      this.persistWallet();

      return this.connectedWallet;
    } catch (error) {
      console.error("Error connecting to wallet:", error);
      throw error;
    }
  }

  /**
   * Get connected wallet info
   */
  getConnectedWallet(): ConnectedWallet | null {
    return this.connectedWallet;
  }

  /**
   * Verify wallet connection is still valid and refresh if needed
   */
  async verifyAndRefreshConnection(): Promise<ConnectedWallet | null> {
    if (!this.connectedWallet) {
      return null;
    }

    try {
      const availableWallets = await this.getAvailableWallets();
      if (!availableWallets.includes(this.connectedWallet.name)) {
        this.disconnect();
        return null;
      }

      const { web3Enable, web3Accounts } = await import(
        "@polkadot/extension-dapp"
      );

      this.extensions = await web3Enable("GovBot");
      if (this.extensions.length === 0) {
        this.disconnect();
        return null;
      }

      this.accounts = await web3Accounts();
      const currentWalletAccounts = this.accounts
        .filter((account) => account.meta.source === this.connectedWallet!.name)
        .map((account) => ({
          address: account.address,
          name: account.meta.name,
          source: account.meta.source,
          type: account.type,
          genesisHash: account.meta.genesisHash ?? undefined,
        }));

      this.connectedWallet.accounts = currentWalletAccounts;
      this.persistWallet();

      return this.connectedWallet;
    } catch (error) {
      console.error("Error verifying wallet connection:", error);
      this.disconnect();
      return null;
    }
  }

  /**
   * Get all available accounts
   */
  getAccounts(): WalletAccount[] {
    return this.connectedWallet?.accounts || [];
  }

  /**
   * Sign a transaction with the specified account
   */
  async signTransaction(
    address: string,
    transaction: unknown
  ): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error("No wallet connected");
    }

    try {
      const { web3FromAddress } = await import("@polkadot/extension-dapp");
      const injector = await web3FromAddress(address);

      if (!injector.signer) {
        throw new Error("Signer not available");
      }

      const signed = await (
        transaction as unknown as {
          signAsync: (
            address: string,
            options: { signer: unknown }
          ) => Promise<{ toHex: () => string }>;
        }
      ).signAsync(address, {
        signer: injector.signer,
      });

      return signed.toHex();
    } catch (error) {
      console.error("Error signing transaction:", error);
      throw error;
    }
  }

  /**
   * Submit a signed transaction
   */
  async submitTransaction(
    address: string,
    transaction: unknown
  ): Promise<string> {
    if (!this.connectedWallet) {
      throw new Error("No wallet connected");
    }

    try {
      return await this.signTransaction(address, transaction);
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.connectedWallet = null;
    this.extensions = [];
    this.accounts = [];

    this.persistWallet();
  }
}

export const walletService = WalletService.getInstance();
