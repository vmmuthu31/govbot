if (typeof window === "undefined") {
  throw new Error(
    "services/wallet.ts must only be imported in a browser/client component. It cannot be used in SSR or API routes."
  );
}

import {
  web3Accounts,
  web3Enable,
  web3FromAddress,
} from "@polkadot/extension-dapp";
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from "@polkadot/extension-inject/types";
import type { SubmittableResult } from "@polkadot/api";

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
  private extensions: InjectedExtension[] = [];
  private accounts: InjectedAccountWithMeta[] = [];
  private connectedWallet: ConnectedWallet | null = null;

  private constructor() {}

  static getInstance(): WalletService {
    if (!WalletService.instance) {
      WalletService.instance = new WalletService();
    }
    return WalletService.instance;
  }

  /**
   * Check if browser has Polkadot.js extension or Subwallet installed
   */
  async getAvailableWallets(): Promise<string[]> {
    if (typeof window === "undefined") {
      return [];
    }

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
      const extensions = await web3Enable("GovBot");

      if (extensions.length === 0) {
        throw new Error(
          "No wallet extension found. Please install Polkadot.js extension or Subwallet."
        );
      }

      this.extensions = extensions;

      const accounts = await web3Accounts();

      if (accounts.length === 0) {
        throw new Error(
          "No accounts found. Please create an account in your wallet extension."
        );
      }

      this.accounts = accounts;

      let selectedExtension = extensions[0];
      if (walletName) {
        const found = extensions.find((ext) => ext.name === walletName);
        if (found) {
          selectedExtension = found;
        }
      }

      const walletAccounts = accounts
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
      const injector = await web3FromAddress(address);

      if (!injector.signer) {
        throw new Error("Signer not available");
      }

      return new Promise((resolve, reject) => {
        (
          transaction as unknown as {
            signAndSend: (
              address: string,
              options: { signer: unknown },
              cb: (txResult: SubmittableResult) => void
            ) => Promise<void>;
          }
        )
          .signAndSend(
            address,
            { signer: injector.signer },
            (txResult: SubmittableResult) => {
              if (txResult.status.isInBlock) {
                console.log(
                  `Transaction included in block: ${txResult.status.asInBlock}`
                );
              } else if (txResult.status.isFinalized) {
                console.log(
                  `Transaction finalized: ${txResult.status.asFinalized}`
                );
                resolve(txResult.status.asFinalized.toString());
              } else if (txResult.isError) {
                reject(new Error("Transaction failed"));
              }
            }
          )
          .catch(reject);
      });
    } catch (error) {
      console.error("Error submitting transaction:", error);
      throw error;
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    this.extensions = [];
    this.accounts = [];
    this.connectedWallet = null;
  }

  /**
   * Check if a specific account can sign transactions
   */
  async canSign(address: string): Promise<boolean> {
    try {
      const injector = await web3FromAddress(address);
      return !!injector.signer;
    } catch {
      return false;
    }
  }
}

export const walletService = WalletService.getInstance();
